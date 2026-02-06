import { forwardRef } from "react"

type BadgeVariant = "default" | "primary" | "secondary" | "accent" | "highlight" | "success" | "warning" | "error" | "outline"
type BadgeSize = "sm" | "md"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-background-muted text-foreground-muted",
  primary: "bg-[var(--color-primary-100)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)] dark:text-[var(--color-primary-200)]",
  secondary: "bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)] dark:bg-[var(--color-secondary-900)] dark:text-[var(--color-secondary-200)]",
  accent: "bg-[var(--color-accent-100)] text-[var(--color-accent-700)] dark:bg-[var(--color-accent-900)] dark:text-[var(--color-accent-200)]",
  highlight: "bg-[var(--color-highlight-100)] text-[var(--color-highlight-700)] dark:bg-[var(--color-highlight-900)] dark:text-[var(--color-highlight-200)]",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  outline: "bg-transparent border border-border text-foreground-muted",
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "sm",
      icon,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center font-medium rounded-[var(--radius-full)]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    )
  }
)

Badge.displayName = "Badge"

export default Badge
