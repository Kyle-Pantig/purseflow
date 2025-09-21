'use client'

import { useCurrency } from '@/contexts/currency-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe } from 'lucide-react'

export function CurrencySelector() {
  const { currency, setCurrency, supportedCurrencies } = useCurrency()

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={currency.code} onValueChange={(value) => {
        const selectedCurrency = supportedCurrencies.find(c => c.code === value)
        if (selectedCurrency) {
          setCurrency(selectedCurrency)
        }
      }}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{currency.symbol}</span>
              <span>{currency.code}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedCurrencies.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <div className="flex items-center gap-2">
                <span>{curr.symbol}</span>
                <span>{curr.code}</span>
                <span className="text-muted-foreground text-sm">- {curr.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
