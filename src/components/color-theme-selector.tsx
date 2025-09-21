'use client'

import { useColor, COLOR_SCHEMES } from '@/contexts/color-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ColorThemeSelector() {
  const { currentScheme, setColorScheme, isLoading } = useColor()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
        <CardDescription>
          Choose your preferred color scheme for charts and visualizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
            <Button
              key={key}
              variant={currentScheme === key ? "default" : "outline"}
              className={cn(
                "h-auto p-4 flex flex-col items-center space-y-3",
                currentScheme === key && "ring-2 ring-primary"
              )}
              onClick={() => setColorScheme(key as keyof typeof COLOR_SCHEMES)}
              disabled={isLoading}
            >
              <div className="flex space-x-1">
                {scheme.colors.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{scheme.name}</span>
                {currentScheme === key && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
