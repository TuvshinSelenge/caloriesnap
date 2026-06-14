"use client";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  const over = value > max;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fed7aa"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "#ef4444" : "#f97316"}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-xl font-bold text-[#1f1f1f]">{label}</span>}
        {sublabel && <span className="text-xs text-gray-500">{sublabel}</span>}
      </div>
    </div>
  );
}
