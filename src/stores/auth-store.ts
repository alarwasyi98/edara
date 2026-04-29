import { create } from 'zustand'

export interface AuthUser {
  id: string
  name: string
  email: string
  image?: string | null
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date
}

interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  setSession: (data: { user: AuthUser; session: AuthSession } | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,

  setSession: (data) =>
    set(
      data
        ? { user: data.user, session: data.session }
        : { user: null, session: null }
    ),

  reset: () => set({ user: null, session: null }),
}))
