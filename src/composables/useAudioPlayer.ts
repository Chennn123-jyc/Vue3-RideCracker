let playerInstance: AudioPlayer | null = null;

import { ref, watch, Ref } from 'vue'; 
import { useMusicStore } from '@/stores/musicStore';

export interface AudioPlayer {
  audio: Ref<HTMLAudioElement | null>;
  initPlayer: (url?: string) => void;
  play: () => void;
  pause: () => void;
  updateMediaMetadata: () => void;
  setCurrentTime: (time: number) => void;
  togglePlayPause: () => void;
  getCurrentTime: () => number;
  cleanup: () => void; 
}

export default function useAudioPlayer(): AudioPlayer {
  // 单例模式
  if (playerInstance) {
    return playerInstance;
  }

  const audio = ref<HTMLAudioElement | null>(null);
  const musicStore = useMusicStore();
  const waitingForCanPlay = ref(false);
  const isManualUpdate = ref(false); 

  // 清理旧音频实例
  const cleanupPreviousAudio = () => {
    if (audio.value) {
      audio.value.pause();
      audio.value.removeEventListener('timeupdate', handleTimeUpdate);
      audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.value.removeEventListener('ended', handleEnded);
      audio.value.removeEventListener('canplay', handleCanPlay);
      audio.value = null;
    }
  };

  // 初始化播放器
  const initPlayer = (url?: string) => {
    const playUrl = url || musicStore.currentSong?.url;
    if (!playUrl) return;

    // 若已有实例且 URL 相同，不重新创建（避免进度丢失）
    if (audio.value && audio.value.src.includes(playUrl)) {
        return; 
    }

    // 清理旧实例（仅在 URL 变化时执行）
    if (audio.value) {
        audio.value.pause();
        audio.value.removeEventListener('timeupdate', handleTimeUpdate);
    }

    audio.value = new Audio(playUrl);
    setupEventListeners();
    audio.value.volume = musicStore.volume / 100;
    audio.value.load();
};

  // 设置事件监听
  const setupEventListeners = () => {
    if (!audio.value) return;
    audio.value.addEventListener('timeupdate', handleTimeUpdate);
    audio.value.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.value.addEventListener('ended', handleEnded);
    audio.value.addEventListener('canplay', handleCanPlay);
  };

  // 添加后台播放支持
  const enableBackgroundPlay = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('previoustrack', () => musicStore.prevSong());
      navigator.mediaSession.setActionHandler('nexttrack', () => musicStore.nextSong());
      updateMediaMetadata();
    }
  };

  // 播放
  const play = () => {
    if (audio.value) {
      audio.value.play()
        .then(() => {
          musicStore.isPlaying = true;
          enableBackgroundPlay();
          waitingForCanPlay.value = false;
        })
        .catch(error => {
          console.error("播放失败:", error);
          waitingForCanPlay.value = true;
        });
    }
  };

  // 音频可播放时重试
  const handleCanPlay = () => {
    if (audio.value && waitingForCanPlay.value) {
      audio.value.play()
        .then(() => {
          musicStore.isPlaying = true;
          waitingForCanPlay.value = false;
        })
        .catch(console.error);
    }
  };

  const togglePlayPause = () => {
    if (!audio.value) return;
    audio.value.paused ? play() : pause();
  };

  // 暂停
  const pause = () => {
    if (audio.value) {
      audio.value.pause();
      musicStore.isPlaying = false;
      waitingForCanPlay.value = false;
    }
  };

  // 更新媒体会话元数据
  const updateMediaMetadata = () => {
    if ('mediaSession' in navigator && musicStore.currentSong) {
      const { title, artist, album, coverUrl } = musicStore.currentSong;
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: coverUrl ? [
          { src: coverUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
          { src: coverUrl, sizes: '128x128', type: 'image/jpeg' }
        ] : []
      });
    }
  };

  // 新增：手动清理方法，替代onUnmounted
  const cleanup = () => {
    cleanupPreviousAudio();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      (['play', 'pause', 'previoustrack', 'nexttrack'] as MediaSessionAction[]).forEach(action => {
        navigator.mediaSession.setActionHandler(action, null);
      });
    }
  };

  // 更新当前播放时间（仅在非手动更新时触发）
  const handleTimeUpdate = () => {
    if (audio.value && !isManualUpdate.value) {
      musicStore.setCurrentTime(audio.value.currentTime);
    }
  };

  // 处理元数据加载完成
  const handleLoadedMetadata = () => {
    if (audio.value) {
      musicStore.duration = audio.value.duration;
      updateMediaMetadata();
    }
  };

  // 处理播放结束
  const handleEnded = () => {
    musicStore.nextSong();
  };

  // 跳转播放进度
  const setCurrentTime = (time: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!audio.value) return resolve();
      
      isManualUpdate.value = true;
      audio.value.currentTime = time;
      musicStore.setCurrentTime(time);
      
      setTimeout(() => {
        isManualUpdate.value = false;
        resolve();
      }, 30);
    });
  };

  const getCurrentTime = (): number => {
    return audio.value ? audio.value.currentTime : 0;
  };

  // 监听歌曲变化
  watch(
    () => musicStore.currentSong,
    (newSong) => {
      if (newSong?.url) {
        initPlayer(newSong.url);
        if (musicStore.isPlaying) {
          setTimeout(play, 100);
        }
      }
    },
    { deep: true }
  );

  // 监听音量变化
  watch(
    () => musicStore.volume,
    (volume) => {
      if (audio.value) {
        audio.value.volume = volume / 100;
      }
    }
  );

  // 监听播放状态变化
  watch(
    () => musicStore.isPlaying,
    (isPlaying) => {
      if (isPlaying) {
        play();
      } else {
        pause();
      }
    }
  );

  playerInstance = {
    audio,
    initPlayer,
    play,
    pause,
    updateMediaMetadata,
    setCurrentTime,
    togglePlayPause,
    getCurrentTime,
    cleanup // 导出清理方法
  };
  return playerInstance;
  
}
