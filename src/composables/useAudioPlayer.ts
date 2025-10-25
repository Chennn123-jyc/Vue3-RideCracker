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
      // 处理相对路径和绝对路径
      const normalizeUrl = (url: string) => {
        if (url.startsWith('/')) {
          return window.location.origin + url;
        }
        return url;
      };
      
      const u1 = new URL(normalizeUrl(url1));
      const u2 = new URL(normalizeUrl(url2));
      return u1.pathname === u2.pathname && u1.search === u2.search;
    } catch (e) {
      return url1 === url2;
    }
  };

  // 安全的音频元素访问
  const getAudioElement = (): HTMLAudioElement | null => {
    return audio.value;
  };

  // 安全的音频元素访问（带断言）
  const getAudioElementAssert = (): HTMLAudioElement => {
    if (!audio.value) {
      throw new Error('音频元素未初始化');
    }
    return audio.value;
  };

  // 清理旧音频实例
  const cleanupPreviousAudio = () => {
    const audioEl = getAudioElement();
    if (audioEl) {
      console.log('🧹 清理旧音频实例');
      audioEl.pause();
      
      // 移除所有事件监听器
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('canplay', handleCanPlay);
      audioEl.removeEventListener('error', handleError);
      audioEl.removeEventListener('progress', handleBufferProgress);
      
      // 重置src以释放资源
      audioEl.src = '';
      audioEl.load();
      
      audio.value = null;
    }
  };

  // 设置事件监听
  const setupEventListeners = () => {
    const audioEl = getAudioElement();
    if (!audioEl) return;
    
    console.log('🔗 设置音频事件监听器');
    
    // 先移除所有可能的事件监听器
    audioEl.removeEventListener('timeupdate', handleTimeUpdate);
    audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.removeEventListener('ended', handleEnded);
    audioEl.removeEventListener('canplay', handleCanPlay);
    audioEl.removeEventListener('error', handleError);
    audioEl.removeEventListener('progress', handleBufferProgress);
    
    // 然后添加新的事件监听器
    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('canplay', handleCanPlay);
    audioEl.addEventListener('error', handleError);
    audioEl.addEventListener('progress', handleBufferProgress);
  };

  // 初始化播放器
const initPlayer = (url?: string) => {
  const playUrl = url || musicStore.currentSong?.url;
  console.log('🎵 初始化播放器，URL:', playUrl);
  
  if (!playUrl) {
    console.log('❌ 没有有效的播放URL');
    return;
  }

  const audioEl = getAudioElement();
  
  // 🔥 关键修复：在初始化时就构建带认证的URL
  let finalUrl = playUrl;
  const token = localStorage.getItem('token');
  if (token && !playUrl.includes('token=')) {
    try {
      const urlObj = new URL(playUrl, window.location.origin);
      urlObj.searchParams.set('token', token);
      finalUrl = urlObj.toString();
      console.log('🔐 初始化时使用带Token的URL:', finalUrl);
    } catch (error) {
      console.error('❌ URL构建失败:', error);
    }
  }
  
  // 使用更精确的URL比较函数
  if (audioEl && areUrlsEqual(audioEl.src, finalUrl)) {
    console.log('🔁 URL相同，跳过重新初始化');
    
    // 关键修复：确保状态完全同步
    if (musicStore.isPlaying && audioEl.paused) {
      console.log('▶️ 同步播放状态');
      audioEl.play().catch(console.error);
    } else if (!musicStore.isPlaying && !audioEl.paused) {
      console.log('⏸️ 同步暂停状态');
      audioEl.pause();
    }
    return;
  }

  // 清理旧实例（仅在 URL 变化时执行）
  cleanupPreviousAudio();

  // 创建新实例
  console.log('🆕 创建新音频实例');
  audio.value = new Audio(finalUrl);
  setupEventListeners();
  
  const newAudioEl = getAudioElementAssert();
  newAudioEl.volume = musicStore.volume / 100;
  newAudioEl.preload = 'auto';
  newAudioEl.crossOrigin = 'anonymous';
  
  // 统一处理音频加载完成后的操作
  const onAudioReady = () => {
    const readyAudioEl = getAudioElement();
    if (!readyAudioEl) return;
    
    console.log('✅ 音频准备就绪，当前播放状态:', musicStore.isPlaying);
    
    // 设置当前时间
    if (musicStore.currentTime > 0) {
      readyAudioEl.currentTime = musicStore.currentTime;
    }
    
    // 如果需要播放，尝试播放
    if (musicStore.isPlaying) {
      console.log('▶️ 自动播放');
      readyAudioEl.play().catch(error => {
        console.error("自动播放失败:", error);
        waitingForCanPlay.value = true;
      });
    }
    
    isInitialized.value = true;
    readyAudioEl.removeEventListener('canplay', onAudioReady);
  };
  
  if (newAudioEl.readyState > 0) {
    // 如果已经可以播放，直接执行
    console.log('⚡ 音频已可播放');
    onAudioReady();
  } else {
    // 否则等待可以播放时执行
    console.log('⏳ 等待音频加载...');
    newAudioEl.addEventListener('canplay', onAudioReady);
  }

  // 启用后台播放支持
  enableBackgroundPlay();
};

  // 提取同步播放状态的逻辑
  const syncPlaybackState = () => {
    const audioEl = getAudioElement();
    if (!audioEl) return;
    
    console.log('🔄 同步播放状态:', { 
      storePlaying: musicStore.isPlaying, 
      audioPaused: audioEl.paused 
    });
    
    if (musicStore.isPlaying && audioEl.paused) {
      setTimeout(() => {
        const delayedAudioEl = getAudioElement();
        if (delayedAudioEl && musicStore.isPlaying && delayedAudioEl.paused) {
          console.log('▶️ 同步播放');
          delayedAudioEl.play().catch(error => {
            console.error("同步播放失败:", error);
          });
        }
      }, 100);
    } else if (!musicStore.isPlaying && !audioEl.paused) {
      console.log('⏸️ 同步暂停');
      audioEl.pause();
    }
  };

  // 缓冲进度处理
  const handleBufferProgress = () => {
    const audioEl = getAudioElement();
    if (audioEl && audioEl.buffered.length > 0) {
      const buffered = audioEl.buffered.end(0);
      const duration = audioEl.duration || 1;
      const bufferPercentage = (buffered / duration) * 100;
      
      // 可以根据需要存储或使用这个值
      console.log(`📊 缓冲进度: ${bufferPercentage.toFixed(1)}%`);
    }
  };

  // 错误处理
  const handleError = () => {
    const audioEl = getAudioElement();
    if (audioEl) {
      console.error("❌ 音频加载错误:", audioEl.error);
      waitingForCanPlay.value = false;
    }
  };

  // 添加后台播放支持
  const enableBackgroundPlay = () => {
    if ('mediaSession' in navigator) {
      console.log('📱 启用媒体会话支持');
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('previoustrack', () => musicStore.prevSong());
      navigator.mediaSession.setActionHandler('nexttrack', () => musicStore.nextSong());
      updateMediaMetadata();
    }
  };

  // 播放
const play = async (): Promise<void> => {
  const audioEl = getAudioElement();
  if (!audioEl) {
    console.error('❌ 音频元素未初始化');
    return;
  }
  
  if (!musicStore.currentSong) {
    console.error('❌ 没有当前歌曲，无法播放');
    return;
  }

  try {
    console.log('🎵 开始播放:', musicStore.currentSong.title);
    console.log('🔗 音频URL:', musicStore.currentSong.url);
    
    // 获取认证 token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ 未找到认证 token');
      throw new Error('用户未认证，请重新登录');
    }

    // 🔥 关键修复：确保URL始终带认证token
    let finalUrl = musicStore.currentSong.url;
    if (token && !finalUrl.includes('token=')) {
      const urlObj = new URL(finalUrl, window.location.origin);
      urlObj.searchParams.set('token', token);
      finalUrl = urlObj.toString();
      console.log('🔐 播放时使用带Token的URL:', finalUrl);
      
      // 如果当前音频源不是带token的URL，更新它
      if (audioEl.src !== finalUrl) {
        console.log('🔄 更新音频源为带Token的URL');
        audioEl.src = finalUrl;
      }
    }
    
    console.log('▶️ 调用 audio.play()');
    await audioEl.play();
    musicStore.isPlaying = true;
    console.log('✅ 播放成功');
    
  } catch (error) {
    console.error('❌ 播放失败:', error);
    
    // 更详细的错误处理
    if (error instanceof Error) {
      if (error.message.includes('认证') || error.name === 'NotAllowedError') {
        console.log('🔐 认证失败或播放被阻止');
        window.dispatchEvent(new CustomEvent('auth-required'));
      }
    }
    
    musicStore.isPlaying = false;
  }
};

  // 添加获取带认证的音频 URL 的方法
  const getAuthenticatedAudioUrl = async (url: string, token: string): Promise<string> => {
    try {
      console.log('🔐 获取带认证的音频流...');
      
      // 检查 URL 是否已经是带认证的格式
      if (url.includes('token=') || url.startsWith('blob:')) {
        console.log('🔁 已经是认证URL或Blob URL，直接返回');
        return url;
      }
      
      // 构建带认证token的URL
      const urlWithToken = new URL(url, window.location.origin);
      urlWithToken.searchParams.set('token', token);
      
      console.log('✅ 使用带Token的URL:', urlWithToken.toString());
      return urlWithToken.toString();
      
    } catch (error) {
      console.error('❌ 获取认证音频流失败:', error);
      
      // 回退到原始URL，但添加认证头的方式
      console.log('🔄 尝试使用原始URL');
      return url;
    }
  };


  // 添加重新加载音频源的方法
  const reloadAudioSource = async (): Promise<void> => {
    const audioEl = getAudioElement();
    if (!audioEl || !musicStore.currentSong) return;
    
    try {
      console.log('🔄 重新加载音频源...');
      
      // 清除当前源
      audioEl.src = '';
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 重新设置带认证的源
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证 token');
      }
      
      const authenticatedUrl = await getAuthenticatedAudioUrl(musicStore.currentSong.url, token);
      audioEl.src = authenticatedUrl;
      audioEl.load();
      
      console.log('✅ 音频源重新加载完成');
    } catch (error) {
      console.error('❌ 重新加载音频源失败:', error);
    }
  };

  // 音频可播放时重试
  const handleCanPlay = () => {
    const audioEl = getAudioElement();
    if (audioEl && waitingForCanPlay.value) {
      console.log('🔄 音频可播放，重试播放');
      audioEl.play()
        .then(() => {
          musicStore.isPlaying = true;
          waitingForCanPlay.value = false;
          console.log('✅ 重试播放成功');
        })
        .catch(error => {
          console.error('❌ 重试播放失败:', error);
          waitingForCanPlay.value = false;
        });
    }
  };

  const togglePlayPause = () => {
    console.log('🎵 切换播放/暂停');
    const audioEl = getAudioElement();
    if (!audioEl) {
      console.log('❌ 音频元素未初始化');
      return;
    }
    audioEl.paused ? play() : pause();
  };

  // 暂停
  const pause = () => {
    console.log('⏸️ 暂停播放');
    const audioEl = getAudioElement();
    if (audioEl) {
      audioEl.pause();
      musicStore.isPlaying = false;
      waitingForCanPlay.value = false;
    }
  };

  // 更新媒体会话元数据
  const updateMediaMetadata = () => {
    if ('mediaSession' in navigator && musicStore.currentSong) {
      const { title, artist, album, coverUrl } = musicStore.currentSong;
      console.log('📱 更新媒体会话元数据:', title);
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
    console.log('🧹 清理音频播放器');
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
    const audioEl = getAudioElement();
    if (audioEl && !isManualUpdate.value) {
      musicStore.setCurrentTime(audioEl.currentTime);
    }
  };

  // 处理元数据加载完成
  const handleLoadedMetadata = () => {
    const audioEl = getAudioElement();
    if (audioEl) {
      console.log('📊 音频元数据加载完成，时长:', audioEl.duration);
      musicStore.duration = audioEl.duration;
      updateMediaMetadata();
      
      if (musicStore.currentSong && !musicStore.currentSong.duration) {
        musicStore.currentSong.duration = audioEl.duration;
      }
    }
  };

  // 处理播放结束
  const handleEnded = () => {
    console.log('🏁 播放结束，切换到下一首');
    musicStore.nextSong();
  };

  // 跳转播放进度
  const setCurrentTime = (time: number): Promise<void> => {
    return new Promise((resolve) => {
      const audioEl = getAudioElement();
      if (!audioEl) return resolve();
      
      console.log('⏱️ 设置播放时间:', time);
      isManualUpdate.value = true;
      audioEl.currentTime = time;
      musicStore.setCurrentTime(time);
      
      setTimeout(() => {
        isManualUpdate.value = false;
        resolve();
      }, 30);
    });
  };

  const getCurrentTime = (): number => {
    const audioEl = getAudioElement();
    return audioEl ? audioEl.currentTime : 0;
  };

  // 监听歌曲变化
  watch(
    () => musicStore.currentSong,
    (newSong) => {
      console.log('🎵 监听到歌曲变化:', newSong?.title);
      if (newSong?.url) {
        initPlayer(newSong.url);
      } else {
        console.log('❌ 新歌曲没有URL，清理播放器');
        cleanup();
      }
    },
    { deep: true }
  );

  // 监听音量变化
  watch(
    () => musicStore.volume,
    (volume) => {
      console.log('🔊 音量变化:', volume);
      const audioEl = getAudioElement();
      if (audioEl) {
        audioEl.volume = volume / 100;
      }
    }
  );

  // 监听播放状态变化
watch(
  () => musicStore.isPlaying,
  (isPlaying) => {
    console.log('🔄 监听到播放状态变化:', isPlaying);
    const audioEl = getAudioElement();
    
    if (!audioEl) {
      console.log('❌ 音频实例不存在，尝试初始化');
      if (musicStore.currentSong?.url) {
        initPlayer(musicStore.currentSong.url);
      }
      return;
    }
    
    // 只有当状态不一致时才同步
    const audioIsPlaying = !audioEl.paused;
    if (isPlaying !== audioIsPlaying) {
      if (isPlaying && audioEl.paused) {
        console.log('▶️ 同步播放状态');
        play().catch(console.error);
      } else if (!isPlaying && !audioEl.paused) {
        console.log('⏸️ 同步暂停状态');
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


