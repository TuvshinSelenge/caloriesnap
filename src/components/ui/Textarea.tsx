"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#1f1f1f]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={[
            "w-full px-3 py-2.5 text-sm bg-white border rounded-xl transition-all duration-150 resize-none",
            "placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]",
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

Textarea.displayName = "Textarea";
