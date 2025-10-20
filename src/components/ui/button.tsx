"use client"

import React from "react"

export type ButtonVariant = "default" | "outline"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  className?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50"

    const variantClass =
      variant === "outline"
        ? "border border-border bg-transparent hover:bg-muted"
        : "bg-primary text-primary-foreground hover:opacity-90"

    return (
      <button ref={ref} className={`${base} ${variantClass} ${className}`.trim()} {...props}>
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"
