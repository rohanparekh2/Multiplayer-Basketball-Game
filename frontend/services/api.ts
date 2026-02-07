import axios from 'axios'
import { GameStateResponse, ShotType, DefenseType } from '@/types/game'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Debug log callback - will be set by DebugProvider
let debugLogCallback: ((log: { type: 'api' | 'error'; message: string; data?: any }) => void) | null = null

export function setDebugLogCallback(callback: typeof debugLogCallback) {
  debugLogCallback = callback
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const logMessage = `${config.method?.toUpperCase()} ${config.url}`
    const logData = {
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params,
    }
    debugLogCallback?.({
      type: 'api',
      message: logMessage,
      data: logData,
    })
    return config
  },
  (error) => {
    debugLogCallback?.({
      type: 'error',
      message: `API Request Error: ${error.message}`,
      data: error,
    })
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const logMessage = `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
    const logData = {
      status: response.status,
      data: response.data,
    }
    debugLogCallback?.({
      type: 'api',
      message: logMessage,
      data: logData,
    })
    return response
  },
  (error) => {
    const logMessage = `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`
    const logData = {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    }
    debugLogCallback?.({
      type: 'error',
      message: logMessage,
      data: logData,
    })
    return Promise.reject(error)
  }
)

export const gameApi = {
  createGame: async (playerOneName: string = 'Player 1', playerTwoName: string = 'Player 2'): Promise<GameStateResponse> => {
    const response = await api.post('/api/game/create', {
      player_one_name: playerOneName,
      player_two_name: playerTwoName,
    })
    return response.data
  },

  getGameState: async (roomId: string): Promise<GameStateResponse> => {
    const response = await api.get(`/api/game/${roomId}`)
    return response.data
  },

  selectShot: async (roomId: string, shotType: ShotType): Promise<{ message: string; game_state: GameStateResponse }> => {
    const response = await api.post(`/api/game/${roomId}/shot`, {
      shot_type: shotType,
    })
    return response.data
  },

  selectDefense: async (roomId: string, defenseType: DefenseType): Promise<{ message: string; game_state: GameStateResponse }> => {
    const response = await api.post(`/api/game/${roomId}/defense`, {
      defense_type: defenseType,
    })
    return response.data
  },

  selectPower: async (roomId: string, power: number): Promise<{ message: string; game_state: GameStateResponse }> => {
    const response = await api.post(`/api/game/${roomId}/power`, {
      power,
    })
    return response.data
  },

  finishAnimation: async (roomId: string): Promise<{ message: string; game_state: GameStateResponse }> => {
    const response = await api.post(`/api/game/${roomId}/animation-finished`)
    return response.data
  },

  nextTurn: async (roomId: string): Promise<{ message: string; game_state: GameStateResponse }> => {
    const response = await api.post(`/api/game/${roomId}/next-turn`)
    return response.data
  },

  getCoachAdvice: async (roomId: string): Promise<{
    recommended_shot: { archetype: string; subtype: string; zone: string }
    advice_text: string
    reasoning: string
    expected_points: number
    challenge?: string
  }> => {
    const response = await api.get(`/api/game/${roomId}/coach-advice`)
    return response.data
  },
}

