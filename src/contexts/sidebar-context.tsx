'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface SidebarDropdownState {
  [key: string]: boolean
}

interface SidebarContextType {
  dropdownStates: SidebarDropdownState
  toggleDropdown: (key: string) => void
  setDropdownState: (key: string, isOpen: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [dropdownStates, setDropdownStates] = useState<SidebarDropdownState>({})

  // Load states from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sidebar-dropdown-states')
        if (saved) {
          setDropdownStates(JSON.parse(saved))
        }
      } catch (error) {
        console.warn('Failed to load sidebar dropdown states from localStorage:', error)
      }
    }
  }, [])

  // Save states to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sidebar-dropdown-states', JSON.stringify(dropdownStates))
      } catch (error) {
        console.warn('Failed to save sidebar dropdown states to localStorage:', error)
      }
    }
  }, [dropdownStates])

  const toggleDropdown = (key: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const setDropdownState = (key: string, isOpen: boolean) => {
    setDropdownStates(prev => ({
      ...prev,
      [key]: isOpen
    }))
  }

  return (
    <SidebarContext.Provider value={{
      dropdownStates,
      toggleDropdown,
      setDropdownState
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebarDropdown = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarDropdown must be used within a SidebarProvider')
  }
  return context
}
