// stores/sportStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Workout {
  id: number
  type: string
  duration: number
  calories: number
  distance?: number
  timestamp: string
}

export const useSportStore = defineStore('sport', () => {
  const workouts = ref<Workout[]>([])
  const currentWorkout = ref<Workout | null>(null)

  // 添加运动记录
  const addWorkout = (workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      id: Date.now(),
      ...workout
    }
    workouts.value.push(newWorkout)
    return newWorkout
  }

  return {
    workouts,
    currentWorkout,
    addWorkout
  }
})