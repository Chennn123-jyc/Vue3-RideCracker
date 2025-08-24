let playerInstance: AudioPlayer | null = null;

import { ref, watch, Ref, computed } from 'vue'; 
import { useMusicStore } from '@/stores/musicStore';

export interface AudioPlayer {
  audio: Ref<HTMLAudioElement | null>;
  initPlayer: (url?: string) => void;
  play: () => Promise<void>;
  pause: () => void;
  updateMediaMetadata: () => void;
  setCurrentTime: (time: number) => Promise<void>;
  togglePlayPause: () => void;
  getCurrentTime: () => number;
  cleanup: () => void; 
  isInitialized: Ref<boolean>;
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
  const isInitialized = ref(false);

  // 精确的URL比较函数
  const areUrlsEqual = (url1: string, url2: string): boolean => {
    try {
      const u1 = new URL(url1);
      const u2 = new URL(url2);
      return u1.pathname === u2.pathname && u1.search === u2.search;
    } catch (e) {
      return url1 === url2;
    }
  };

  // 清理旧音频实例
  const cleanupPreviousAudio = () => {
    if (audio.value) {
      audio.value.pause();
      
      // 移除所有事件监听器
      audio.value.removeEventListener('timeupdate', handleTimeUpdate);
      audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.value.removeEventListener('ended', handleEnded);
      audio.value.removeEventListener('canplay', handleCanPlay);
      audio.value.removeEventListener('error', handleError);
      audio.value.removeEventListener('progress', handleBufferProgress);
      
      // 重置src以释放资源
      audio.value.src = '';
      audio.value.load();
      
      audio.value = null;
    }
  };

  // 设置事件监听
  const setupEventListeners = () => {
    if (!audio.value) return;
    
    // 先移除所有可能的事件监听器
    audio.value.removeEventListener('timeupdate', handleTimeUpdate);
    audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.value.removeEventListener('ended', handleEnded);
    audio.value.removeEventListener('canplay', handleCanPlay);
    audio.value.removeEventListener('error', handleError);
    audio.value.removeEventListener('progress', handleBufferProgress);
    
    // 然后添加新的事件监听器
    audio.value.addEventListener('timeupdate', handleTimeUpdate);
    audio.value.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.value.addEventListener('ended', handleEnded);
    audio.value.addEventListener('canplay', handleCanPlay);
    audio.value.addEventListener('error', handleError);
    audio.value.addEventListener('progress', handleBufferProgress);
  };

  // 提取同步播放状态的逻辑
  const syncPlaybackState = () => {
    if (!audio.value) return;
    
    if (musicStore.isPlaying && audio.value.paused) {
      setTimeout(() => {
        if (audio.value && musicStore.isPlaying && audio.value.paused) {
          audio.value.play().catch(error => {
            console.error("自动播放失败:", error);
          });
        }
      }, 100);
    } else if (!musicStore.isPlaying && !audio.value.paused) {
      audio.value.pause();
    }
  };

  // 初始化播放器
  const initPlayer = (url?: string) => {
    const playUrl = url || musicStore.currentSong?.url;
    if (!playUrl) return;

    // 使用更精确的URL比较函数
    if (audio.value && areUrlsEqual(audio.value.src, playUrl)) {
      syncPlaybackState();
      return;
    }

    // 清理旧实例（仅在 URL 变化时执行）
    cleanupPreviousAudio();

    // 创建新实例
    audio.value = new Audio(playUrl);
    setupEventListeners();
    audio.value.volume = musicStore.volume / 100;
    audio.value.preload = 'auto';
    
    // 统一处理音频加载完成后的操作
    const onAudioReady = () => {
      if (!audio.value) return;
      
      // 设置当前时间
      if (musicStore.currentTime > 0) {
        audio.value.currentTime = musicStore.currentTime;
      }
      
      // 如果需要播放，尝试播放
      if (musicStore.isPlaying) {
        audio.value.play().catch(error => {
          console.error("播放失败:", error);
          waitingForCanPlay.value = true;
        });
      }
      
      isInitialized.value = true;
      audio.value.removeEventListener('canplay', onAudioReady);
    };
    
    if (audio.value.readyState > 0) {
      // 如果已经可以播放，直接执行
      onAudioReady();
    } else {
      // 否则等待可以播放时执行
      audio.value.addEventListener('canplay', onAudioReady);
    }
  };

  // 缓冲进度处理
  const handleBufferProgress = () => {
    if (audio.value && audio.value.buffered.length > 0) {
      const buffered = audio.value.buffered.end(0);
      const duration = audio.value.duration || 1;
      const bufferPercentage = (buffered / duration) * 100;
      
      // 可以根据需要存储或使用这个值
      console.log(`缓冲进度: ${bufferPercentage.toFixed(1)}%`);
    }
  };

  // 错误处理
  const handleError = () => {
    if (audio.value) {
      console.error("音频加载错误:", audio.value.error);
      waitingForCanPlay.value = false;
    }
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
  const play = async (): Promise<void> => {
    if (audio.value) {
      try {
        await audio.value.play();
        musicStore.isPlaying = true;
        enableBackgroundPlay();
        waitingForCanPlay.value = false;
      } catch (error) {
        console.error("播放失败:", error);
        waitingForCanPlay.value = true;
        throw error;
      }
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

  // 手动清理方法
  const cleanup = () => {
    cleanupPreviousAudio();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      (['play', 'pause', 'previoustrack', 'nexttrack'] as MediaSessionAction[]).forEach(action => {
        navigator.mediaSession.setActionHandler(action, null);
      });
    }
    isInitialized.value = false;
  };

  // 更新当前播放时间
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
      
      if (musicStore.currentSong && !musicStore.currentSong.duration) {
        musicStore.currentSong.duration = audio.value.duration;
      }
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
      // 只有当音频实例存在且状态不一致时才同步
      if (audio.value && isPlaying !== !audio.value.paused) {
        if (isPlaying && audio.value.paused) {
          play().catch(console.error);
        } else if (!isPlaying && !audio.value.paused) {
          pause();
        }
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
    cleanup,
    isInitialized
  };
  return playerInstance;
}