import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  disabled,
  className 
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parseDate(value) : undefined
  )

  // Parse DD-MM-YYYY format to Date object
  function parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined
    const [day, month, year] = dateStr.split('-')
    if (!day || !month || !year) return undefined
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  // Format Date object to DD-MM-YYYY format
  function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    return `${day}-${month}-${year}`
  }

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && onChange) {
      onChange(formatDate(selectedDate))
    } else if (!selectedDate && onChange) {
      onChange('')
    }
  }

  // Update local state when value prop changes
  React.useEffect(() => {
    setDate(value ? parseDate(value) : undefined)
  }, [value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            formatDate(date)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}