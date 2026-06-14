"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1f1f1f]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={[
            "w-full px-3 py-2.5 text-sm bg-white border rounded-xl transition-all duration-150 appearance-none cursor-pointer",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]",
            error
              ? "border-red-400 focus-visible:ring-red-400"
              : "border-[#fed7aa] hover:border-[#fdba74]",
            className,
          ].join(" ")}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
