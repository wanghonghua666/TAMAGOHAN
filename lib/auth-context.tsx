'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, isFirebaseEnabled } from './firebase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  isDemo: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      // Real Firebase authentication
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          setUser(userData)
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => unsubscribe()
    } else {
      // Demo mode - create a demo user
      setTimeout(() => {
        const demoUser: User = {
          id: 'demo-user-123',
          email: 'demo@tamagohan.app',
          displayName: 'Demo User',
          photoURL: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setUser(demoUser)
        setLoading(false)
      }, 1000)
    }
  }, [])

  const logout = async () => {
    try {
      if (isFirebaseEnabled && auth) {
        await signOut(auth)
      } else {
        // Demo mode logout
        setUser(null)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    logout,
    isDemo: !isFirebaseEnabled
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 