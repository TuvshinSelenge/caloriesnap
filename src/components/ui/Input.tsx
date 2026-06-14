"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1f1f1f]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full px-3 py-2.5 text-sm bg-white border rounded-xl transition-all duration-150",
            "placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-0",
            error
              ? "border-red-400 focus-visible:ring-red-400"
              : "border-[#fed7aa] hover:border-[#fdba74]",
            className,
          ].join(" ")}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
