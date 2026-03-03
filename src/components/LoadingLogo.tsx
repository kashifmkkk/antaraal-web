import React from "react";
import Logo from "@/components/Logo";

const LoadingLogo: React.FC<{size?: number}> = ({ size = 48 }) => {
  const sizeClass = size === 24 ? 'w-6 h-6' : size === 32 ? 'w-8 h-8' : size === 64 ? 'w-16 h-16' : 'w-12 h-12';
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`animate-spin ${sizeClass}`}>
        <Logo className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

export default LoadingLogo;
