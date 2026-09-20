import React from 'react';

interface ChuvadiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const ChuvadiLogo: React.FC<ChuvadiLogoProps> = ({ 
  className = '', 
  size = 40,
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-md"
        style={{ width: size, height: size }}
      >
        <img 
          src="/chuvadi-logo.svg" 
          alt="Chuvadi Logo" 
          width={size} 
          height={size}
          className="w-full h-full object-contain filter drop-shadow-sm select-none"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight text-amber-100 font-sans">
              Chuvadi
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
              சுவடி
            </span>
          </div>
          <span className="text-[11px] font-medium text-emerald-400/90 tracking-wide mt-0.5">
            a way of life
          </span>
        </div>
      )}
    </div>
  );
};
