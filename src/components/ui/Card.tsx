import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-2xl border border-[#fed7aa]/60 shadow-sm",
        paddingClasses[padding],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
