// src/components/fpl/Pitch.tsx
import React from "react";

type PitchProps = {
  children: React.ReactNode;
  variant?: "half" | "full";
  className?: string;
};

export default function Pitch({
  children,
  variant = "half",
  className = "",
}: PitchProps) {
  // Reduced heights to match smaller cards
  const heightClass =
    variant === "half"
      ? "h-[580px] md:h-[650px]" 
      : "h-[800px] md:h-[900px]"; 

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`relative mx-auto max-w-[820px] ${heightClass} rounded-2xl overflow-hidden`}
        style={{
          backgroundImage: "url('/images/pitch.svg')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",  // 🔥 align image to the top
          backgroundSize: "120% auto",       // 🔥 zoom in (increase % for more zoom)
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-between py-6 px-3 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
