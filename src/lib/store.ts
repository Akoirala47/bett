import { create } from 'zustand'
import { Profile, Sprint, DailyCheckin, GameState } from './supabase'

interface AppState {
  // User
  user: Profile | null
  partner: Profile | null
  setUser: (user: Profile | null) => void
  setPartner: (partner: Profile | null) => void
  
  // Sprint
  currentSprint: Sprint | null
  partnerSprint: Sprint | null
  setCurrentSprint: (sprint: Sprint | null) => void
  setPartnerSprint: (sprint: Sprint | null) => void
  
  // Checkins
  checkins: DailyCheckin[]
  partnerCheckins: DailyCheckin[]
  setCheckins: (checkins: DailyCheckin[]) => void
  setPartnerCheckins: (checkins: DailyCheckin[]) => void
  addCheckin: (checkin: DailyCheckin) => void
  
  // Game State
  gameState: GameState | null
  setGameState: (state: GameState | null) => void
  
  // UI
  selectedLogNode: string | null
  setSelectedLogNode: (nodeId: string | null) => void
  isPeekOpen: boolean
  setIsPeekOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  partner: null,
  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner }),
  
  // Sprint
  currentSprint: null,
  partnerSprint: null,
  setCurrentSprint: (currentSprint) => set({ currentSprint }),
  setPartnerSprint: (partnerSprint) => set({ partnerSprint }),
  
  // Checkins
  checkins: [],
  partnerCheckins: [],
  setCheckins: (checkins) => set({ checkins }),
  setPartnerCheckins: (partnerCheckins) => set({ partnerCheckins }),
  addCheckin: (checkin) => set((state) => ({ checkins: [checkin, ...state.checkins] })),
  
  // Game State
  gameState: null,
  setGameState: (gameState) => set({ gameState }),
  
  // UI
  selectedLogNode: null,
  setSelectedLogNode: (selectedLogNode) => set({ selectedLogNode }),
  isPeekOpen: false,
  setIsPeekOpen: (isPeekOpen) => set({ isPeekOpen }),
}))
