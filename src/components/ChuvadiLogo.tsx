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
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 shrink-0 ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-md select-none"
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 512 512" 
          width={size} 
          height={size}
          className="w-full h-full object-contain filter drop-shadow-sm"
          aria-label="Chuvadi Palm-Leaf Logo"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Wood Gradients */}
            <linearGradient id="chuvadiWoodGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8be89" />
              <stop offset="35%" stopColor="#d69f62" />
              <stop offset="70%" stopColor="#b67a3e" />
              <stop offset="100%" stopColor="#8a5322" />
            </linearGradient>
            <linearGradient id="chuvadiWoodGrad2" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#f2cf9d" />
              <stop offset="50%" stopColor="#dfa86a" />
              <stop offset="100%" stopColor="#9a5f27" />
            </linearGradient>
            <linearGradient id="chuvadiWoodGrad3" x1="0%" y1="0%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#fae0b8" />
              <stop offset="40%" stopColor="#e4b377" />
              <stop offset="100%" stopColor="#a4692e" />
            </linearGradient>
            
            {/* Antique Bronze Stylus Gradients */}
            <linearGradient id="chuvadiStylusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dcd0a6" />
              <stop offset="30%" stopColor="#ab9357" />
              <stop offset="70%" stopColor="#6e5726" />
              <stop offset="100%" stopColor="#3e3012" />
            </linearGradient>
            <linearGradient id="chuvadiNibGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff0c4" />
              <stop offset="50%" stopColor="#c9ad6a" />
              <stop offset="100%" stopColor="#6b5321" />
            </linearGradient>

    {/* Cord & Bead Gradients */}
            <linearGradient id="chuvadiCordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8d6e63" />
              <stop offset="50%" stopColor="#5d4037" />
              <stop offset="100%" stopColor="#3e2723" />
            </linearGradient>
          </defs>

          {/* Palm Leaf Slat 4 (Bottom-most) */}
          <g transform="rotate(32 230 250)">
            <rect x="70" y="195" width="370" height="96" rx="20" fill="url(#chuvadiWoodGrad1)" stroke="#5c3813" strokeWidth="2.5" />
            <line x1="85" y1="220" x2="425" y2="220" stroke="#754719" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="85" y1="243" x2="425" y2="243" stroke="#754719" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="85" y1="266" x2="425" y2="266" stroke="#754719" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Palm Leaf Slat 3 */}
          <g transform="rotate(22 230 250)">
            <rect x="65" y="190" width="375" height="98" rx="20" fill="url(#chuvadiWoodGrad2)" stroke="#633d15" strokeWidth="2.5" />
            <line x1="80" y1="215" x2="425" y2="215" stroke="#7a4b1d" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="80" y1="239" x2="425" y2="239" stroke="#7a4b1d" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="80" y1="263" x2="425" y2="263" stroke="#7a4b1d" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Palm Leaf Slat 2 */}
          <g transform="rotate(11 230 250)">
            <rect x="60" y="185" width="380" height="102" rx="20" fill="url(#chuvadiWoodGrad1)" stroke="#6b4218" strokeWidth="2.5" />
            <line x1="75" y1="210" x2="425" y2="210" stroke="#875320" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="75" y1="236" x2="425" y2="236" stroke="#875320" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="75" y1="262" x2="425" y2="262" stroke="#875320" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Palm Leaf Slat 1 (Top Primary Chuvadi Leaf) */}
          <g transform="rotate(-2 230 250)">
            <rect x="52" y="178" width="395" height="110" rx="22" fill="url(#chuvadiWoodGrad3)" stroke="#784a1b" strokeWidth="3" />
            
            {/* Binding Cord Hole with Metal Grommet */}
            <circle cx="100" cy="233" r="14" fill="#3a1e0b" stroke="#784a1b" strokeWidth="4" />
            <circle cx="100" cy="233" r="9" fill="#180c04" />
            
            {/* Margin divider lines */}
            <line x1="140" y1="184" x2="140" y2="282" stroke="#663b12" strokeWidth="2.5" />
            
            {/* Ruling lines for ancient script */}
            <line x1="148" y1="202" x2="330" y2="202" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="148" y1="223" x2="330" y2="223" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="148" y1="244" x2="330" y2="244" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.75" />
            <line x1="148" y1="265" x2="330" y2="265" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.75" />
            
            {/* Ancient Ledger Column Grid on Right */}
            <line x1="335" y1="184" x2="335" y2="282" stroke="#663b12" strokeWidth="2.5" />
            <line x1="375" y1="184" x2="375" y2="282" stroke="#663b12" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="335" y1="208" x2="435" y2="208" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.7" />
            <line x1="335" y1="233" x2="435" y2="233" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.7" />
            <line x1="335" y1="258" x2="435" y2="258" stroke="#78491c" strokeWidth="1.5" strokeOpacity="0.7" />
            
            {/* Ancient Numeral Tallies in Ledger Grid */}
            <text x="355" y="202" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">I</text>
            <text x="355" y="227" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">II</text>
            <text x="355" y="252" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">III</text>
            <text x="355" y="277" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">IV</text>
            
            <text x="405" y="202" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">|||</text>
            <text x="405" y="227" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">||||</text>
            <text x="405" y="252" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">|||</text>
            <text x="405" y="277" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill="#4d2c0e" textAnchor="middle">|||</text>

            {/* Engraved Ledger Wave */}
            <path d="M 180 235 
                     C 195 215, 215 255, 235 225
                     C 255 255, 275 220, 290 235" 
                  fill="none" 
                  stroke="#3d220a" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" />
          </g>

          {/* Hanging Braided Cord & Carved Wooden Bead */}
          <g>
            <path d="M 94 236 
                     C 80 270, 58 310, 62 360 
                     C 65 390, 85 410, 82 430" 
                  fill="none" 
                  stroke="url(#chuvadiCordGrad)" 
                  strokeWidth="10" 
                  strokeLinecap="round" />
            <path d="M 94 236 
                     C 80 270, 58 310, 62 360 
                     C 65 390, 85 410, 82 430" 
                  fill="none" 
                  stroke="#271810" 
                  strokeWidth="2.5" 
                  strokeDasharray="3,5" />
                  
            <circle cx="82" cy="438" r="16" fill="url(#chuvadiWoodGrad1)" stroke="#3e2723" strokeWidth="3" />
            <ellipse cx="82" cy="438" rx="10" ry="16" fill="none" stroke="#271810" strokeWidth="1.5" strokeOpacity="0.6" />
            <ellipse cx="82" cy="438" rx="4" ry="16" fill="none" stroke="#271810" strokeWidth="1.5" strokeOpacity="0.6" />
            <ellipse cx="81" cy="418" rx="8" ry="6" fill="#3e2723" stroke="#271810" strokeWidth="2" />
          </g>

          {/* Antique Bronze Stylus (Ezhuthani) resting diagonally */}
          <g>
            <polygon points="252,246 258,242 430,76 422,70" fill="url(#chuvadiStylusGrad)" stroke="#2b200b" strokeWidth="1.5" />
            <polygon points="238,256 253,243 257,247" fill="url(#chuvadiNibGrad)" stroke="#1f1606" strokeWidth="1.2" />
            <rect x="310" y="160" width="14" height="26" rx="4" transform="rotate(-44 317 173)" fill="url(#chuvadiNibGrad)" stroke="#3d2d10" strokeWidth="1.5" />
            <rect x="340" y="132" width="16" height="28" rx="5" transform="rotate(-44 348 146)" fill="url(#chuvadiStylusGrad)" stroke="#3d2d10" strokeWidth="1.5" />
            <rect x="380" y="96" width="18" height="30" rx="5" transform="rotate(-44 389 111)" fill="url(#chuvadiNibGrad)" stroke="#3d2d10" strokeWidth="1.5" />
            <circle cx="438" cy="62" r="14" fill="url(#chuvadiNibGrad)" stroke="#2b200b" strokeWidth="2.5" />
            <ellipse cx="438" cy="62" rx="9" ry="14" fill="none" stroke="#523d14" strokeWidth="1.5" />
            <circle cx="448" cy="52" r="7" fill="url(#chuvadiStylusGrad)" stroke="#2b200b" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-amber-100 font-sans">
              Chuvadi
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400/90 tracking-wide mt-0.5">
            a way of life
          </span>
        </div>
      )}
    </div>
  );
};
