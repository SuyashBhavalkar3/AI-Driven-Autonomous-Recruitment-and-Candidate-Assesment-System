"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string
  id?: string
  disabled?: boolean
  className?: string
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}>({});

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, disabled, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
        <div
          className={cn("grid gap-2", className)}
          {...props}
          ref={ref}
          role="radiogroup"
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isSelected = context.value === value
    const isDisabled = disabled || context.disabled

    const handleClick = () => {
      if (!isDisabled && context.onValueChange) {
        context.onValueChange(value)
      }
    }

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-[#B8915C] text-[#B8915C] ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isSelected && "bg-[#B8915C] border-[#B8915C]",
          className
        )}
        {...props}
      >
        {isSelected && (
          <Circle className="h-2.5 w-2.5 fill-current text-white mx-auto" />
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }