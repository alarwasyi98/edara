import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const signInEmailSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

const signUpEmailSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(7),
})

export async function getSession() {
  try {
    const result = await authClient.getSession()
    if (result.error) return null
    return result.data ?? null
  } catch {
    // Backend not available (SPA mode without server)
    return null
  }
}

export async function requireSession() {
  const result = await getSession()
  if (!result?.session || !result?.user) {
    throw new Error('Unauthorized')
  }
  return result
}

type SignInEmailInput = z.infer<typeof signInEmailSchema>
type SignUpEmailInput = z.infer<typeof signUpEmailSchema>

export async function signInEmail(input: SignInEmailInput) {
  return authClient.signIn.email(signInEmailSchema.parse(input))
}

export async function signUpEmail(input: SignUpEmailInput) {
  return authClient.signUp.email(signUpEmailSchema.parse(input))
}

export async function signOut() {
  return authClient.signOut()
}
