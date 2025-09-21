'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AddExpenseDialog } from '@/components/add-expense-dialog'
import { useColor } from '@/contexts/color-context'
import { Plus } from 'lucide-react'

export function FloatingAddButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const { isLoading } = useColor()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      // Show FAB when scrolling
      setIsVisible(true)
      
      // Clear existing timeout
      clearTimeout(timeoutId)
      
      // Hide FAB after 2 seconds of no scrolling
      timeoutId = setTimeout(() => {
        setIsVisible(false)
      }, 5000)
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial timeout to hide FAB after 2 seconds if no scroll
    timeoutId = setTimeout(() => {
      setIsVisible(false)
    }, 5000)
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
    }`}>
      {isLoading ? (
        <Skeleton className="h-14 w-14 rounded-full" />
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add new expense</span>
        </Button>
      )}
      
      <AddExpenseDialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
      />
    </div>
  )
}
