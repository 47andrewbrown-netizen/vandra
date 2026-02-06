import { forwardRef } from "react"

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize
  label?: string
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", label = "Loading...", className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={`inline-flex items-center justify-center ${className}`}
        {...props}
      >
        <svg
          className={`animate-spin text-current ${sizeStyles[size]}`}
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
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)

Spinner.displayName = "Spinner"

// Full page loading spinner
interface LoadingProps {
  message?: string
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <Spinner size="lg" label={message} />
      <p className="text-sm text-foreground-muted animate-pulse">{message}</p>
    </div>
  )
}

// Skeleton loader for content
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded-[var(--radius-sm)]",
    circular: "rounded-full",
    rectangular: "rounded-[var(--radius-md)]",
  }

  return (
    <div
      className={`
        bg-background-muted animate-pulse
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height || (variant === "text" ? "1em" : undefined),
        ...style,
      }}
      {...props}
    />
  )
}

export default Spinner
