import {ref} from 'vue';

export interface Song {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string
  url: string
  duration: number
  lyrics: string[]
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}
  
interface ParsedLyric {
  time: number
  text: string
}
const visibleLyrics = ref<ParsedLyric[]>([])