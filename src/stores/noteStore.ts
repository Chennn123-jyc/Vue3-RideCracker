import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export const useNoteStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const nextId = ref(1)

  // 添加新笔记
  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      id: nextId.value++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...note
    }
    notes.value.push(newNote)
    saveToLocalStorage()
    return newNote
  }

  // 更新笔记
  const updateNote = (id: number, updates: Partial<Note>) => {
    const index = notes.value.findIndex(note => note.id === id)
    if (index !== -1) {
      notes.value[index] = {
        ...notes.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveToLocalStorage()
    }
  }

  // 删除笔记
  const deleteNote = (id: number) => {
    notes.value = notes.value.filter(note => note.id !== id)
    saveToLocalStorage()
  }

  // 从本地存储加载笔记
  const loadFromLocalStorage = () => {
    const savedNotes = localStorage.getItem('personal-notes')
    if (savedNotes) {
      notes.value = JSON.parse(savedNotes)
      // 更新下一个ID
      if (notes.value.length > 0) {
        nextId.value = Math.max(...notes.value.map(note => note.id)) + 1
      }
    }
  }

  // 保存笔记到本地存储
  const saveToLocalStorage = () => {
    localStorage.setItem('personal-notes', JSON.stringify(notes.value))
  }

  // 初始化
  loadFromLocalStorage()

  return {
    notes,
    addNote,
    updateNote,
    deleteNote
  }
})