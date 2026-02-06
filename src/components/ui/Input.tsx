"use client"

import { forwardRef, useState } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = "left",
      className = "",
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === "password"
    const inputType = isPassword ? (showPassword ? "text" : "password") : type

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`
              w-full h-10 px-3 py-2
              bg-background-subtle text-foreground
              border rounded-[var(--radius-md)]
              placeholder:text-foreground-subtle
              transition-all duration-[var(--transition-fast)]
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon && iconPosition === "left" ? "pl-10" : ""}
              ${icon && iconPosition === "right" || isPassword ? "pr-10" : ""}
              ${error 
                ? "border-[var(--color-error-500)] focus:ring-[var(--color-error-500)]" 
                : "border-border hover:border-border-strong focus:border-ring"
              }
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
          {icon && iconPosition === "right" && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error-500)]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-foreground-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

// Eye icons for password visibility toggle
function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full min-h-[100px] px-3 py-2
            bg-background-subtle text-foreground
            border rounded-[var(--radius-md)]
            placeholder:text-foreground-subtle
            transition-all duration-[var(--transition-fast)]
            resize-y
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? "border-[var(--color-error-500)] focus:ring-[var(--color-error-500)]" 
              : "border-border hover:border-border-strong focus:border-ring"
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--color-error-500)]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-foreground-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export default Input
