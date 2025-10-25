import { defineStore } from 'pinia'
import type { Song } from '@/types/music'
import useAudioPlayer from '@/composables/useAudioPlayer'

export interface ParsedLyric {
  time: number
  text: string
}

export const useMusicStore = defineStore('music', {
  state: (): {
    currentSong: Song | null
    playlist: Song[]
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    repeatMode: 'none' | 'one' | 'all'
    showCoverLyricsMode: boolean
    playHistory: Song[]
    playQueue: Song[]
    playOrder: 'normal' | 'shuffle' | 'single'
    // 新增状态同步相关状态
    _listeners: Set<Function>
    likedSongs: Set<number>
  } => ({
    currentSong: null,
    playlist: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 80,
    repeatMode: 'none',
    showCoverLyricsMode: false,
    playHistory: [],
    playQueue: [],
    playOrder: 'normal',
    // 新增状态同步相关状态初始化
    _listeners: new Set(),
    likedSongs: new Set(),
  }),

  actions: {
    // 新增：状态监听器管理
    addStateListener(listener: Function) {
      this._listeners.add(listener);
    },

    removeStateListener(listener: Function) {
      this._listeners.delete(listener);
    },

    _notifyStateChange(type: string, payload?: any) {
      this._listeners.forEach(listener => {
        try {
          listener(type, payload);
        } catch (error) {
          console.error('状态监听器错误:', error);
        }
      });
    },

    // 新增：喜欢状态管理
    setLikedSongs(songIds: number[]) {
      this.likedSongs = new Set(songIds);
      this._notifyStateChange('likedSongsUpdate', { songIds });
    },

    addLikedSong(songId: number) {
      this.likedSongs.add(songId);
      this._notifyStateChange('songLiked', { songId, liked: true });
    },

    removeLikedSong(songId: number) {
      this.likedSongs.delete(songId);
      this._notifyStateChange('songLiked', { songId, liked: false });
    },

    toggleLikedSong(songId: number) {
      if (this.likedSongs.has(songId)) {
        this.removeLikedSong(songId);
      } else {
        this.addLikedSong(songId);
      }
    },

    isSongLiked(songId: number): boolean {
      return this.likedSongs.has(songId);
    },

    // 修改现有方法：添加状态通知
    togglePlayOrder() {
      const orders: Array<'normal' | 'shuffle' | 'single'> = ['normal', 'shuffle', 'single']
      const currentIndex = orders.indexOf(this.playOrder)
      this.playOrder = orders[(currentIndex + 1) % orders.length]
      
      console.log('🔄 切换播放顺序:', this.playOrder);
      
      // 如果切换到随机模式，自动关闭重复模式
      if (this.playOrder === 'shuffle') {
        this.repeatMode = 'none'
      }
      
      // 通知状态变化
      this._notifyStateChange('playOrderChange', { playOrder: this.playOrder });
    },

    // 初始化音频实例与状态同步
    syncAudioWithState() {
      const player = useAudioPlayer()
      // 确保音频实例和当前歌曲都存在
      if (!this.currentSong || !player.audio.value) {
        // 若音频实例未初始化，先初始化再同步
        if (this.currentSong) {
          player.initPlayer(this.currentSong.url);
          // 初始化后延迟同步进度（确保实例加载完成）
          setTimeout(() => {
            player.setCurrentTime(this.currentTime);
            this.isPlaying ? player.play() : player.pause();
          }, 100);
        }
        return;
      }
  
      // 若音频实例已存在，直接同步
      player.setCurrentTime(this.currentTime);
      if (this.isPlaying) {
        player.play();
      } else {
        player.pause();
      }
    },
    
    initPlaylist(songs: Song[]) {
      this.playlist = songs
      console.log('🎵 初始化播放列表，歌曲数量:', songs.length);
      if (songs.length > 0 && !this.currentSong) {
        this.setCurrentSong(songs[0])
      }
      
      // 通知状态变化
      this._notifyStateChange('playlistUpdate', { songs });
    },

    // 更新播放状态
    setIsPlaying(status: boolean) {
      console.log('🎵 设置播放状态:', status);
      const wasPlaying = this.isPlaying;
      this.isPlaying = status;
      
      // 通知状态变化
      if (wasPlaying !== status) {
        this._notifyStateChange('playbackState', {
          isPlaying: status,
          wasPlaying
        });
      }
    },

    // 更新当前播放时间和进度
    setDuration(newDuration: number) {
      this.duration = newDuration;
    },

    addToPlaylist(song: Song) {
      this.playlist.push(song);
      this._notifyStateChange('playlistAdd', { song });
    },

    // 设置当前歌曲 - 修改：添加状态通知
    setCurrentSong(song: Song) {
      // 如果切换的是同一首歌，只更新信息，不重新初始化
      if (this.currentSong?.id === song.id && this.currentSong?.url === song.url) {
        console.log('🔁 同一首歌，只更新信息');
        this.currentSong = { ...this.currentSong, ...song };
        return;
      }

      const previousSong = this.currentSong;
      this.currentSong = song;
      this.duration = song.duration || 0;
      this.currentTime = 0;
      
      // 通知状态变化
      this._notifyStateChange('songChange', { 
        song, 
        previousSong 
      });
      
      // 强制重新初始化播放器
      const player = useAudioPlayer();
      player.initPlayer(song.url);
      
      // 添加到播放历史
      this.playHistory = this.playHistory.filter(s => s.id !== song.id);
      this.playHistory.unshift(song);
      
      // 限制历史记录数量
      if (this.playHistory.length > 50) {
        this.playHistory.pop();
      }
      
      console.log('🎵 设置当前歌曲:', song.title);
    },

    togglePlayPause() {
      console.log('🔄 Store: 切换播放/暂停状态');
      const wasPlaying = this.isPlaying;
      this.isPlaying = !this.isPlaying;
      
      // 通知状态变化
      this._notifyStateChange('playbackState', {
        isPlaying: this.isPlaying,
        wasPlaying
      });
      
      // 确保播放器状态同步
      const player = useAudioPlayer();
      if (this.isPlaying) {
        if (!player.audio.value && this.currentSong) {
          player.initPlayer(this.currentSong.url);
        }
      }
    },

    play() {
      console.log('▶️ Store: 设置播放状态为 true');
      const wasPlaying = this.isPlaying;
      this.isPlaying = true;
      
      // 通知状态变化
      if (!wasPlaying) {
        this._notifyStateChange('playbackState', {
          isPlaying: true,
          wasPlaying: false
        });
      }
      
      // 如果当前有歌曲但播放器未初始化，强制初始化
      if (this.currentSong && !useAudioPlayer().audio.value) {
        console.log('🔄 播放时检测到播放器未初始化，强制初始化');
        useAudioPlayer().initPlayer(this.currentSong.url);
      }
    },

    pause() {
      console.log('⏸️ Store: 设置播放状态为 false');
      const wasPlaying = this.isPlaying;
      this.isPlaying = false;
      
      // 通知状态变化
      if (wasPlaying) {
        this._notifyStateChange('playbackState', {
          isPlaying: false,
          wasPlaying: true
        });
      }
    },

    prevSong() {
      if (!this.currentSong || this.playlist.length === 0) {
        console.log('❌ 没有当前歌曲或播放列表为空');
        return;
      }
      
      const currentIndex = this.playlist.findIndex(s => s.id === this.currentSong!.id);
      
      if (currentIndex === -1) {
        console.log('❌ 当前歌曲不在播放列表中');
        return;
      }
      
      let prevIndex: number;
      
      switch (this.playOrder) {
        case 'shuffle':
          // 随机模式下，上一首也是随机的
          do {
            prevIndex = Math.floor(Math.random() * this.playlist.length);
          } while (prevIndex === currentIndex && this.playlist.length > 1);
          console.log('🎲 随机播放，上一首索引:', prevIndex);
          break;
          
        case 'single':
          // 单曲循环
          prevIndex = currentIndex;
          console.log('🔂 单曲循环');
          break;
          
        case 'normal':
        default:
          // 顺序播放
          prevIndex = (currentIndex - 1 + this.playlist.length) % this.playlist.length;
          console.log('⏮️ 顺序播放，上一首索引:', prevIndex);
          break;
      }
      
      this.setCurrentSong(this.playlist[prevIndex]);
      this.play();
    },

    nextSong() {
      if (!this.currentSong || this.playlist.length === 0) {
        console.log('❌ 没有当前歌曲或播放列表为空');
        return;
      }
      
      // 优先从播放队列中取歌
      if (this.playQueue.length > 0) {
        const nextSong = this.playQueue.shift()!;
        console.log('🎵 从播放队列取歌:', nextSong.title);
        this.setCurrentSong(nextSong);
        this.play();
        return;
      }

      const currentIndex = this.playlist.findIndex(s => s.id === this.currentSong!.id);
      
      if (currentIndex === -1) {
        console.log('❌ 当前歌曲不在播放列表中');
        return;
      }
      
      let nextIndex: number;
      
      switch (this.playOrder) {
        case 'shuffle':
          // 随机播放 - 确保不重复当前歌曲
          do {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
          } while (nextIndex === currentIndex && this.playlist.length > 1);
          console.log('🎲 随机播放，下一首索引:', nextIndex);
          break;
          
        case 'single':
          // 单曲循环，播放同一首歌
          nextIndex = currentIndex;
          console.log('🔂 单曲循环');
          break;
          
        case 'normal':
        default:
          // 顺序播放
          nextIndex = (currentIndex + 1) % this.playlist.length;
          console.log('⏭️ 顺序播放，下一首索引:', nextIndex);
          break;
      }
      
      this.setCurrentSong(this.playlist[nextIndex]);
      this.play();
    },

    toggleRepeatMode() {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all']
      const idx = modes.indexOf(this.repeatMode)
      this.repeatMode = modes[(idx + 1) % modes.length]
      console.log('🔄 切换重复模式:', this.repeatMode);
      
      // 通知状态变化
      this._notifyStateChange('repeatModeChange', { repeatMode: this.repeatMode });
    },

    setCurrentTime(time: number) {
      // 增加更精确的时间比较，避免频繁更新
      if (Math.abs(this.currentTime - time) < 0.05) return;
      
      const newTime = Math.max(0, Math.min(this.duration, time));
      this.currentTime = newTime;
      
      console.log('⏱️ Store: 更新播放时间:', newTime.toFixed(1));
      
      // 检查是否播放结束
      if (this.duration > 0 && newTime >= this.duration - 0.5) {
        console.log('🏁 检测到播放结束');
        this.handlePlaybackEnd();
      }
    },

    // 播放结束处理逻辑
    handlePlaybackEnd() {
      if (this.repeatMode === 'one') {
        console.log('🔁 单曲循环，重新开始');
        this.currentTime = 0;
        this.play();
      } else if (this.repeatMode === 'all') {
        console.log('🔁 列表循环，播放下一首');
        this.nextSong();
      } else {
        console.log('⏹️ 播放结束，暂停');
        this.pause();
        this.currentTime = 0;
      }
    },

    setVolume(volume: number) {
      this.volume = Math.max(0, Math.min(100, volume));
      this._notifyStateChange('volumeChange', { volume: this.volume });
    },

    downloadCurrentSong() {
      if (!this.currentSong) return;
      const link = document.createElement('a');
      link.href = this.currentSong.url;
      if (this.currentSong.url.startsWith('blob:')) {
        link.download = `${this.currentSong.title}.mp3`;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    toggleCoverLyricsMode() {
      this.showCoverLyricsMode = !this.showCoverLyricsMode;
      this._notifyStateChange('coverLyricsModeChange', { 
        showCoverLyricsMode: this.showCoverLyricsMode 
      });
    },
    
    updateDuration(duration: number) {
      this.duration = duration;
    },
    
    // 添加歌曲到播放队列
    addToQueue(song: Song) {
      this.playQueue.push(song);
      this._notifyStateChange('queueAdd', { song });
    },
    
    // 清空播放队列
    clearQueue() {
      this.playQueue = [];
      this._notifyStateChange('queueClear');
    },

    // 验证当前播放状态是否一致
    validatePlaybackState(): boolean {
      const player = useAudioPlayer();
      const audioEl = player.audio.value;
      
      if (!this.currentSong) {
        return !audioEl; // 没有当前歌曲时，播放器也应该为空
      }
      
      if (!audioEl) {
        console.warn('⚠️ 状态不一致: 有当前歌曲但播放器未初始化');
        return false;
      }
      
      const stateConsistent = 
        this.isPlaying === !audioEl.paused &&
        Math.abs(this.currentTime - (audioEl.currentTime || 0)) < 1;
      
      if (!stateConsistent) {
        console.warn('⚠️ 播放状态不一致:', {
          store: { isPlaying: this.isPlaying, currentTime: this.currentTime },
          audio: { paused: audioEl.paused, currentTime: audioEl.currentTime }
        });
      }
      
      return stateConsistent;
    },

    // 强制恢复状态一致性
    forceStateSync() {
      console.log('🔄 强制同步播放状态');
      const player = useAudioPlayer();
      
      if (!this.currentSong) {
        player.cleanup();
        return;
      }
      
      // 重新初始化播放器
      player.initPlayer(this.currentSong.url);
      
      // 设置进度
      if (this.currentTime > 0) {
        setTimeout(() => {
          player.setCurrentTime(this.currentTime);
        }, 100);
      }
      
      // 设置播放状态
      if (this.isPlaying) {
        setTimeout(() => {
          player.play().catch(console.error);
        }, 200);
      }
    }
  },

  getters: {
    // 新增：获取喜欢歌曲列表
    getLikedSongs(): number[] {
      return Array.from(this.likedSongs);
    },

    // 添加播放顺序文本描述
    playOrderText(): string {
      switch (this.playOrder) {
        case 'normal':
          return '顺序播放'
        case 'shuffle':
          return '随机播放'
        case 'single':
          return '单曲循环'
        default:
          return '顺序播放'
      }
    },
    
    progressPercentage(): number {
      return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
    },

    formattedCurrentTime(): string {
      const mins = Math.floor(this.currentTime / 60)
      const secs = Math.floor(this.currentTime % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    formattedDuration(): string {
      const mins = Math.floor(this.duration / 60)
      const secs = Math.floor(this.duration % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    parsedLyrics(): ParsedLyric[] {
      if (!this.currentSong?.lyrics) return []
      
      return this.currentSong.lyrics
        .map((line: string): ParsedLyric | null => {
          const match = line.match(/^\[?(\d+):(\d+)\.(\d+)\]?/) // 支持带/不带中括号
          if (!match) return null
          
          const [, min, sec, ms] = match
          const time = parseInt(min, 10) * 60 + parseInt(sec, 10) + parseInt(ms, 10) / 100
          const text = line.replace(/^\d+:\d+\.\d+\s+/, '').trim()
          
          return text ? { time, text } : null
        })
        .filter((lyric): lyric is ParsedLyric => lyric !== null)
        .sort((a, b) => a.time - b.time)
    },

    currentLyricIndex(): number {
      if (this.parsedLyrics.length === 0) return -1
      
      // 使用二分查找提高性能
      let left = 0
      let right = this.parsedLyrics.length - 1
      let result = -1
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        if (this.parsedLyrics[mid].time <= this.currentTime) {
          result = mid
          left = mid + 1
        } else {
          right = mid - 1
        }
      }
      
      return result
    },

    currentLyricLine(): string {
      const idx = this.currentLyricIndex
      return idx === -1 ? '' : this.parsedLyrics[idx]?.text ?? ''
    },
    
    // 获取下一行歌词（用于预览）
    nextLyricLine(): string {
      const idx = this.currentLyricIndex
      return idx === -1 || idx >= this.parsedLyrics.length - 1 
        ? '' 
        : this.parsedLyrics[idx + 1]?.text ?? ''
    },
    
    // 检查是否有下一首歌
    hasNextSong(): boolean {
      if (this.playQueue.length > 0) return true
      if (this.repeatMode === 'one' || this.repeatMode === 'all') return true
      
      if (!this.currentSong || this.playlist.length === 0) return false
      
      const idx = this.playlist.findIndex(s => s.id === this.currentSong!.id)
      return idx < this.playlist.length - 1
    },
    
    // 检查是否有上一首歌
    hasPrevSong(): boolean {
      if (!this.currentSong || this.playlist.length === 0) return false
      
      const idx = this.playlist.findIndex(s => s.id === this.currentSong!.id)
      return idx > 0 || this.playHistory.length > 1
    },

    // 获取当前播放状态摘要（用于调试）
    playbackStatus(): string {
      if (!this.currentSong) return '未播放';
      
      const status = this.isPlaying ? '播放中' : '已暂停';
      const progress = `${this.formattedCurrentTime} / ${this.formattedDuration}`;
      const mode = this.playOrder === 'shuffle' ? '随机' : 
                   this.playOrder === 'single' ? '单曲' : '顺序';
      
      return `${this.currentSong.title} - ${status} (${progress}) [${mode}]`;
    },

    // 检查播放器是否健康 - 修复：移除对 action 的调用
    isPlayerHealthy(): boolean {
      const player = useAudioPlayer();
      const audioEl = player.audio.value;
      
      if (!this.currentSong) {
        return !audioEl; // 没有当前歌曲时，播放器也应该为空
      }
      
      if (!audioEl) {
        console.warn('⚠️ 状态不一致: 有当前歌曲但播放器未初始化');
        return false;
      }
      
      const stateConsistent = 
        this.isPlaying === !audioEl.paused &&
        Math.abs(this.currentTime - (audioEl.currentTime || 0)) < 1;
      
      if (!stateConsistent) {
        console.warn('⚠️ 播放状态不一致:', {
          store: { isPlaying: this.isPlaying, currentTime: this.currentTime },
          audio: { paused: audioEl.paused, currentTime: audioEl.currentTime }
        });
      }
      
      return !!audioEl && 
             !audioEl.error && 
             audioEl.readyState > 0 &&
             stateConsistent;
    }
  },
})

export type MusicStore = ReturnType<typeof useMusicStore>