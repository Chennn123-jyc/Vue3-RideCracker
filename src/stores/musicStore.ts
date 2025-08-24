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
    shuffle: boolean
    repeatMode: 'none' | 'one' | 'all'
    showCoverLyricsMode: boolean
    playHistory: Song[]
    playQueue: Song[]
  } => ({
    currentSong: null as Song | null,
    playlist: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 80,
    shuffle: false,
    repeatMode: 'none',
    showCoverLyricsMode: false,
    playHistory: [],
    playQueue: [],
  }),

  actions: {
    //初始化音频实例与状态同步
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
      player.setCurrentTime(this.currentTime); // 同步进度
      if (this.isPlaying) {
        player.play(); // 同步播放状态
      } else {
        player.pause();
      }
    },
    
    initPlaylist(songs: Song[]) {
      this.playlist = songs
      if (songs.length > 0 && !this.currentSong) {
        this.setCurrentSong(songs[0])
      }
    },
    //更新播放状态
    setIsPlaying(status: boolean) {
      this.isPlaying = status
    },

    //更新当前播放时间和进度
    setDuration(newDuration:number) {
      this.duration = newDuration;
    },

    addToPlaylist(song: Song) {
      this.playlist.push(song);
    },

    // 提取设置当前歌曲的公共逻辑
    setCurrentSong(song: Song) {
      this.currentSong = song
      this.duration = song.duration
      this.currentTime = 0
      // 添加到播放历史
      this.playHistory = this.playHistory.filter(s => s.id !== song.id)
      this.playHistory.unshift(song)
      // 限制历史记录数量
      if (this.playHistory.length > 50) {
        this.playHistory.pop()
      }
    },

    togglePlayPause() {
      this.isPlaying = !this.isPlaying
    },

    play() {
      this.isPlaying = true
    },

    pause() {
      this.isPlaying = false
    },

    prevSong() {
      if (!this.currentSong || this.playlist.length === 0) return
      
      const idx = this.playlist.findIndex(s => s.id === this.currentSong!.id)
      const prevIdx = (idx - 1 + this.playlist.length) % this.playlist.length
      this.setCurrentSong(this.playlist[prevIdx])
      this.play()
    },

    nextSong() {
      if (!this.currentSong || this.playlist.length === 0) return
      
      // 优先从播放队列中取歌
      if (this.playQueue.length > 0) {
        this.setCurrentSong(this.playQueue.shift()!)
        this.play()
        return
      }

      const idx = this.playlist.findIndex(s => s.id === this.currentSong!.id)
      let nextIdx = (idx + 1) % this.playlist.length
      
      if (this.shuffle) {
        // 确保随机不重复当前歌曲
        do {
          nextIdx = Math.floor(Math.random() * this.playlist.length)
        } while (nextIdx === idx && this.playlist.length > 1)
      }
      
      this.setCurrentSong(this.playlist[nextIdx])
      this.play()
    },

    toggleShuffle() {
      this.shuffle = !this.shuffle
    },

    toggleRepeatMode() {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all']
      const idx = modes.indexOf(this.repeatMode)
      this.repeatMode = modes[(idx + 1) % modes.length]
    },

    setCurrentTime(time: number) {
      if (Math.abs(this.currentTime - time) < 0.1) return;
      this.currentTime = Math.max(0, Math.min(this.duration, time))
      
      if (this.currentTime >= this.duration) {
        if (this.repeatMode === 'one') {
          this.currentTime = 0 // 重置进度
          this.play() // 继续播放
        } else if (this.repeatMode === 'all') {
          this.nextSong()
        } else {
          this.pause()
        }
      }
    },

    setVolume(volume: number) {
      this.volume = Math.max(0, Math.min(100, volume))
    },

    downloadCurrentSong() {
      if (!this.currentSong) return
      const link = document.createElement('a')
      link.href = this.currentSong.url
      if (this.currentSong.url.startsWith('blob:')) {
        link.download = `${this.currentSong.title}.mp3`
      }
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    toggleCoverLyricsMode() {
      this.showCoverLyricsMode = !this.showCoverLyricsMode
    },
    
    updateDuration(duration: number) {
      this.duration = duration
    },
    
    // 添加歌曲到播放队列
    addToQueue(song: Song) {
      this.playQueue.push(song)
    },
    
    // 清空播放队列
    clearQueue() {
      this.playQueue = []
    }
  },

  getters: {
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
          // 修改 parsedLyrics getter 中的匹配逻辑
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
    }
  },
})

export type MusicStore = ReturnType<typeof useMusicStore>