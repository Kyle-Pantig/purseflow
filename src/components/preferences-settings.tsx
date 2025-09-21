'use client'

import { useColor, COLOR_SCHEMES } from '@/contexts/color-context'
import { useCurrency } from '@/contexts/currency-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Palette, DollarSign, Settings, Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PreferencesSkeleton } from '@/components/preferences-skeleton'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { SUPPORTED_CURRENCIES } from '@/contexts/currency-context'

const CURRENCIES = SUPPORTED_CURRENCIES

export function PreferencesSettings() {
  const { currentScheme, setColorScheme, isLoading: colorLoading } = useColor()
  const { currency, setCurrency, isLoading: currencyLoading } = useCurrency()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  // Show skeleton loading if either context is loading
  if (colorLoading || currencyLoading) {
    return <PreferencesSkeleton />
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Color Theme Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme for charts and visualizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
              <Button
                key={key}
                variant={currentScheme === key ? "default" : "outline"}
                className={cn(
                  "h-auto p-3 flex flex-col items-center space-y-2",
                  currentScheme === key && "ring-2 ring-primary"
                )}
                 onClick={() => {
                   setColorScheme(key as keyof typeof COLOR_SCHEMES)
                 }}
                 disabled={colorLoading}
              >
                <div className="flex space-x-1">
                  {scheme.colors.slice(0, 5).map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">{scheme.name}</span>
                  {currentScheme === key && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Currency Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency
          </CardTitle>
          <CardDescription>
            Select your preferred currency for displaying amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {CURRENCIES.map((curr) => (
              <Button
                key={curr.code}
                variant={currency.code === curr.code ? "default" : "outline"}
                className={cn(
                  "h-auto p-3 flex flex-col items-center space-y-2 min-h-[80px]",
                  currency.code === curr.code && "ring-2 ring-primary"
                )}
                onClick={() => setCurrency(curr)}
              >
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-bold">{curr.symbol}</span>
                  <span className="text-xs font-medium">{curr.code}</span>
                </div>
                <span className="text-xs text-muted-foreground text-center leading-tight px-1 break-words">
                  {curr.name}
                </span>
                {currency.code === curr.code && (
                  <Check className="h-3 w-3 flex-shrink-0" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Toggle Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred theme for the application interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.value}
                  variant={theme === option.value ? "default" : "outline"}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center space-y-1",
                    theme === option.value && "ring-2 ring-primary"
                  )}
                  onClick={() => setTheme(option.value)}
                  disabled={!mounted}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                  {theme === option.value && (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Configure how data is displayed in your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Color Scheme</h4>
                <p className="text-sm text-muted-foreground">
                  Your selected color scheme
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLOR_SCHEMES[currentScheme].colors[0] }}
                />
                {COLOR_SCHEMES[currentScheme].name}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Theme Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Light, dark, or system preference
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                {theme === 'light' && <Sun className="h-3 w-3" />}
                {theme === 'dark' && <Moon className="h-3 w-3" />}
                {theme === 'system' && <Monitor className="h-3 w-3" />}
                {themeOptions.find(opt => opt.value === theme)?.label || 'System'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Currency Format</h4>
                <p className="text-sm text-muted-foreground">
                  How amounts are displayed
                </p>
              </div>
              <Badge variant="secondary">
                {currency.symbol} {currency.code}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
