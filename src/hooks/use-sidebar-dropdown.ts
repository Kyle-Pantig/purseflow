import { useSidebarDropdown as useSidebarDropdownContext } from '@/contexts/sidebar-context'

/**
 * Hook to manage sidebar dropdown states with localStorage persistence
 * 
 * @example
 * ```tsx
 * const { isOpen, toggle, setOpen } = useSidebarDropdown('Expenses')
 * 
 * return (
 *   <Collapsible open={isOpen} onOpenChange={setOpen}>
 *     <CollapsibleTrigger onClick={toggle}>
 *       Expenses
 *     </CollapsibleTrigger>
 *     <CollapsibleContent>
 *       <div>dropdown content</div>
 *     </CollapsibleContent>
 *   </Collapsible>
 * )
 * ```
 */
export function useSidebarDropdown(key: string): {
  isOpen: boolean
  toggle: () => void
  setOpen: (isOpen: boolean) => void
} {
  const { dropdownStates, toggleDropdown, setDropdownState } = useSidebarDropdownContext()
  
  return {
    isOpen: dropdownStates[key] ?? false,
    toggle: () => toggleDropdown(key),
    setOpen: (isOpen: boolean) => setDropdownState(key, isOpen)
  }
}