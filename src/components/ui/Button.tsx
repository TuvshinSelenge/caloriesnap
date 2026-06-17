"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#f97316] text-white hover:bg-[#ea580c] active:bg-[#c2410c] shadow-sm",
  secondary:
    "bg-white text-[#1f1f1f] border border-[#fed7aa] hover:bg-[#fff7ed] shadow-sm",
  ghost: "text-[#f97316] hover:bg-[#fff7ed]",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-10 px-3 py-1.5 text-sm rounded-lg",
  md: "min-h-11 px-4 py-2 text-sm rounded-xl",
  lg: "min-h-12 px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
