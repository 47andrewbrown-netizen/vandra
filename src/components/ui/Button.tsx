"use client"

import { forwardRef } from "react"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-primary-500)] text-white
    hover:bg-[var(--color-primary-600)]
    active:bg-[var(--color-primary-700)]
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-background-subtle text-foreground
    border border-border
    hover:bg-background-muted hover:border-border-strong
    active:bg-[var(--color-neutral-200)]
  `,
  ghost: `
    bg-transparent text-foreground-muted
    hover:bg-background-muted hover:text-foreground
    active:bg-[var(--color-neutral-200)]
  `,
  danger: `
    bg-[var(--color-error-500)] text-white
    hover:bg-[var(--color-error-600)]
    active:bg-[var(--color-error-600)]
    shadow-sm hover:shadow-md
  `,
  success: `
    bg-[var(--color-success-500)] text-white
    hover:bg-[var(--color-success-600)]
    active:bg-[var(--color-success-600)]
    shadow-sm hover:shadow-md
  `,
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-[var(--radius-md)]
          transition-all duration-[var(--transition-fast)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"

// Spinner component for loading state
function Spinner({ size }: { size: ButtonSize }) {
  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <svg
      className={`animate-spin ${sizeMap[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default Button
