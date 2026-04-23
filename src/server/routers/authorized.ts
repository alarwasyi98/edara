import { base } from './context'
import { authMiddleware } from './middlewares/auth'

export const authorized = base.use(authMiddleware)

export type AuthContext = {
  session: any
  user: {
    id: string
    name: string
    email: string
    image?: string
  }
}