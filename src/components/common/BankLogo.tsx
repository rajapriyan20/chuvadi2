import React from 'react';

export interface BankDefinition {
  id: string;
  name: string;
  shortName: string;
  category: 'bank' | 'fintech' | 'cash' | 'other';
  bgColor: string;
  renderLogo: (size: number) => React.ReactNode;
}

export const BANK_LOGOS: BankDefinition[] = [
  // Top 5 Thumbnails specifically requested from uploaded images
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    category: 'bank',
    bgColor: '#0071bc',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#0071bc" />
        <circle cx="50" cy="50" r="14.5" fill="#ffffff" />
        <rect x="46.5" y="50" width="7" height="50" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    category: 'bank',
    bgColor: '#ffffff',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        {/* Top-Left Bracket */}
        <path d="M18 15H44V27H30V41H18V15Z" fill="#ed2128" />
        {/* Top-Right Bracket */}
        <path d="M82 15H56V27H70V41H82V15Z" fill="#ed2128" />
        {/* Bottom-Left Bracket */}
        <path d="M18 71H44V59H30V45H18V71Z" fill="#ed2128" />
        {/* Bottom-Right Bracket */}
        <path d="M82 71H56V59H70V45H82V71Z" fill="#ed2128" />
        {/* Central Solid Navy Square */}
        <rect x="37" y="30" width="26" height="26" fill="#002468" />
        {/* Text */}
        <text x="50" y="87" fontSize="10.5" fontWeight="900" fill="#002468" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.6">HDFC BANK</text>
      </svg>
    )
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    category: 'bank',
    bgColor: '#002d62',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Deep Navy Disc */}
        <circle cx="50" cy="50" r="50" fill="#002d62" />
        {/* Red Slanted Center Bar */}
        <path d="M44 14.5L56 11V85.5L44 89Z" fill="#ed1c24" />
        {/* White Infinity Symbol */}
        <path
          d="M 50 50 C 37 26, 14 28, 14 50 C 14 72, 37 74, 50 50 C 63 26, 86 28, 86 50 C 86 72, 63 74, 50 50 Z"
          stroke="#ffffff"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    )
  },
  {
    id: 'union',
    name: 'Union Bank of India',
    shortName: 'Union',
    category: 'bank',
    bgColor: '#ffffff',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        {/* Red U shape */}
        <path
          d="M 21 21 L 21 63 C 21 82, 53 82, 53 63 L 53 37"
          stroke="#d52229"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Blue interlocking U shape */}
        <path
          d="M 37 57 L 37 37 C 37 18, 79 18, 79 37 L 79 79"
          stroke="#005596"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    )
  },
  {
    id: 'sc',
    name: 'Standard Chartered Bank (SCB)',
    shortName: 'SCB',
    category: 'bank',
    bgColor: '#ffffff',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" rx="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <g transform="translate(25.54, 5.3)">
          {/* Lower Green Ribbon */}
          <path
            d="M 53.507868,107.78883 7.6318678,77.923829 c 0,0 -5.753,-3.308 -7.07000001,-9.47 -1.84999999,-8.652 4.24800001,-16.07 4.24800001,-16.07 l 59.5390002,38.775 c 4.593,2.993 5.846,9.117001 2.894,13.736001 -3.033,4.745 -9.265,5.792 -13.737,2.894 z"
            fill="#38d200"
          />
          {/* Upper Blue Ribbon + Bottom Blue Droplet */}
          <path
            d="m 10.054868,45.983829 c 0,0 -7.0270002,-4.243 -7.0270002,-14.057 0,-9.78 7.0240002,-13.971 7.0240002,-13.971 l 25.08,-16.4140004 a 9.927,9.927 0 0 1 10.82,16.6450004 l -21.138,13.764 36.015,23.456 c 0,0 6.483,3.714 7.76,9.984 1.783,8.747 -4.238,15.954 -4.238,15.954 z M 9.9218678,109.37183 c 2.3540002,0 4.0300002,-0.747 5.6650002,-1.807 l 12.243,-7.975001 -12.243,-7.973 c -1.65,-1.063 -3.382,-1.807 -5.6650002,-1.807 a 9.782,9.782 0 1 0 0,19.562001 z"
            fill="#0473ea"
          />
          {/* Upper Green Droplet */}
          <path
            d="m 57.260868,22.170829 c -2.355,0 -4.031,0.747 -5.666,1.806 l -12.244,7.974 12.244,7.974 c 1.65,1.064 3.383,1.808 5.666,1.808 a 9.781,9.781 0 1 0 0,-19.562"
            fill="#38d200"
          />
        </g>
      </svg>
    )
  },

  // Additional major banks
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    category: 'bank',
    bgColor: '#b02a30',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#b02a30" />
        <circle cx="20" cy="12" r="3.5" fill="#f37021" />
        <path d="M17 18H23V30H17V18Z" fill="#ffffff" />
        <path d="M12 20H15V30H12V20Z" fill="#f37021" />
        <path d="M25 20H28V30H25V20Z" fill="#f37021" />
      </svg>
    )
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'Axis',
    category: 'bank',
    bgColor: '#97144d',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#97144d" />
        <path d="M20 9L29 27H23.5L20 18.5L16.5 27H11L20 9Z" fill="#ffffff" />
        <path d="M20 22.5L22.5 27H17.5L20 22.5Z" fill="#97144d" />
      </svg>
    )
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    category: 'bank',
    bgColor: '#f26522',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#f26522" />
        <circle cx="20" cy="20" r="12" fill="#ffffff" />
        <path d="M15 14H22C24.2 14 26 15.3 26 17C26 18.2 25.2 19.2 24 19.7C25.5 20.2 26.5 21.3 26.5 23C26.5 25 24.5 26 22 26H15V14ZM18 16.5V19H21.5C22.3 19 23 18.5 23 17.8C23 17 22.3 16.5 21.5 16.5H18ZM18 21V23.5H22C22.8 23.5 23.5 23 23.5 22.2C23.5 21.5 22.8 21 22 21H18Z" fill="#f26522" />
      </svg>
    )
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    category: 'bank',
    bgColor: '#a20032',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#a20032" />
        <circle cx="20" cy="20" r="14" stroke="#fdb913" strokeWidth="2.5" fill="none" />
        <text x="20" y="24" fontSize="11" fontWeight="bold" fill="#fdb913" textAnchor="middle" fontFamily="sans-serif">PNB</text>
      </svg>
    )
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'Canara',
    category: 'bank',
    bgColor: '#0077b6',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0077b6" />
        <path d="M12 28L20 12L28 28H12Z" fill="#fdb913" />
        <path d="M16 28L20 20L24 28H16Z" fill="#0077b6" />
      </svg>
    )
  },
  {
    id: 'indusind',
    name: 'IndusInd Bank',
    shortName: 'IndusInd',
    category: 'bank',
    bgColor: '#851c20',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#851c20" />
        <circle cx="20" cy="20" r="12" stroke="#d4af37" strokeWidth="2" fill="none" />
        <text x="20" y="24" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">IB</text>
      </svg>
    )
  },
  {
    id: 'yes',
    name: 'Yes Bank',
    shortName: 'Yes',
    category: 'bank',
    bgColor: '#004b87',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#004b87" />
        <path d="M12 20L18 26L28 14" stroke="#e31837" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="20" y="34" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">YES</text>
      </svg>
    )
  },
  {
    id: 'federal',
    name: 'Federal Bank',
    shortName: 'Federal',
    category: 'bank',
    bgColor: '#002147',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#002147" />
        <rect x="12" y="11" width="16" height="18" rx="2" stroke="#fdb913" strokeWidth="2" fill="none" />
        <text x="20" y="24" fontSize="10" fontWeight="bold" fill="#fdb913" textAnchor="middle" fontFamily="sans-serif">FB</text>
      </svg>
    )
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    shortName: 'IDFC',
    category: 'bank',
    bgColor: '#9d1c24',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#9d1c24" />
        <text x="20" y="19" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">IDFC</text>
        <text x="20" y="27" fontSize="7" fontWeight="bold" fill="#f3a41d" textAnchor="middle" fontFamily="sans-serif">FIRST</text>
      </svg>
    )
  },
  {
    id: 'citi',
    name: 'Citibank',
    shortName: 'Citi',
    category: 'bank',
    bgColor: '#003b70',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#003b70" />
        <path d="M12 16C16 12 24 12 28 16" stroke="#ed1c24" strokeWidth="2.5" strokeLinecap="round" />
        <text x="20" y="26" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">citi</text>
      </svg>
    )
  },
  {
    id: 'chase',
    name: 'JPMorgan Chase',
    shortName: 'Chase',
    category: 'bank',
    bgColor: '#117aca',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#117aca" />
        <path d="M14 14H26V18H18V26H14V14Z" fill="#ffffff" />
        <path d="M26 26H14V22H22V14H26V26Z" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: 'hsbc',
    name: 'HSBC Bank',
    shortName: 'HSBC',
    category: 'bank',
    bgColor: '#db0011',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <path d="M12 12L20 20L12 28V12Z" fill="#db0011" />
        <path d="M28 12L20 20L28 28V12Z" fill="#db0011" />
        <path d="M12 12H28L20 20L12 12Z" fill="#ffffff" />
        <path d="M12 28H28L20 20L12 28Z" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    shortName: 'GPay',
    category: 'fintech',
    bgColor: '#1f2937',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />
        <path d="M20 18V22H25.7C25.4 23.5 24 26 20 26C16.7 26 14 23.3 14 20C14 16.7 16.7 14 20 14C21.9 14 23.2 14.8 23.9 15.5L26.8 12.6C25 10.9 22.7 10 20 10C14.5 10 10 14.5 10 20C10 25.5 14.5 30 20 30C25.8 30 29.6 25.9 29.6 20.2C29.6 19.4 29.5 18.7 29.4 18H20Z" fill="#4285f4" />
      </svg>
    )
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    category: 'fintech',
    bgColor: '#5f259f',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#5f259f" />
        <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">पे</text>
      </svg>
    )
  },
  {
    id: 'paytm',
    name: 'Paytm',
    shortName: 'Paytm',
    category: 'fintech',
    bgColor: '#002e6e',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#002e6e" />
        <text x="14" y="25" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">pay</text>
        <text x="27" y="25" fontSize="10" fontWeight="bold" fill="#00b9f5" textAnchor="middle" fontFamily="sans-serif">tm</text>
      </svg>
    )
  },
  {
    id: 'cred',
    name: 'CRED',
    shortName: 'CRED',
    category: 'fintech',
    bgColor: '#111827',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#000000" stroke="#374151" strokeWidth="1" />
        <circle cx="20" cy="20" r="10" stroke="#ffffff" strokeWidth="2.5" fill="none" />
        <rect x="18.5" y="16" width="3" height="8" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: 'cash',
    name: 'Cash / Wallet',
    shortName: 'Cash',
    category: 'cash',
    bgColor: '#059669',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#059669" />
        <rect x="10" y="13" width="20" height="14" rx="2.5" stroke="#ffffff" strokeWidth="2" fill="none" />
        <circle cx="20" cy="20" r="3.5" fill="#ffffff" />
        <circle cx="13" cy="20" r="1" fill="#ffffff" />
        <circle cx="27" cy="20" r="1" fill="#ffffff" />
      </svg>
    )
  },
  {
    id: 'crypto',
    name: 'Crypto / Bitcoin',
    shortName: 'Crypto',
    category: 'other',
    bgColor: '#f59e0b',
    renderLogo: (size) => (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#f59e0b" />
        <text x="20" y="27" fontSize="18" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">₿</text>
      </svg>
    )
  }
];

export function resolveBankLogoId(icon?: string, name?: string, institution?: string): string {
  // If explicitly set (including 'none'), respect it
  if (icon) return icon;

  // Auto-detect based on institution or name keywords
  const text = `${institution || ''} ${name || ''}`.toLowerCase();
  if (text.includes('sbi') || text.includes('state bank')) return 'sbi';
  if (text.includes('hdfc')) return 'hdfc';
  if (text.includes('kotak')) return 'kotak';
  if (text.includes('union')) return 'union';
  if (text.includes('standard chartered') || text.includes('scb') || text.includes('stanchart') || text.includes('stan.l') || text.includes('sc')) return 'sc';
  if (text.includes('icici')) return 'icici';
  if (text.includes('axis')) return 'axis';
  if (text.includes('baroda') || text.includes('bob')) return 'bob';
  if (text.includes('pnb') || text.includes('punjab national')) return 'pnb';
  if (text.includes('canara')) return 'canara';
  if (text.includes('indusind')) return 'indusind';
  if (text.includes('yes bank')) return 'yes';
  if (text.includes('federal')) return 'federal';
  if (text.includes('idfc')) return 'idfc';
  if (text.includes('citi')) return 'citi';
  if (text.includes('chase')) return 'chase';
  if (text.includes('hsbc')) return 'hsbc';
  if (text.includes('gpay') || text.includes('google pay')) return 'gpay';
  if (text.includes('phonepe')) return 'phonepe';
  if (text.includes('paytm')) return 'paytm';
  if (text.includes('cred')) return 'cred';
  if (text.includes('cash') || text.includes('petty')) return 'cash';
  if (text.includes('crypto') || text.includes('bitcoin') || text.includes('eth')) return 'crypto';

  return 'none';
}

interface BankLogoProps {
  iconId?: string;
  name?: string;
  institution?: string;
  size?: number;
  className?: string;
}

export const BankLogo: React.FC<BankLogoProps> = ({
  iconId,
  name,
  institution,
  size = 22,
  className = ''
}) => {
  const resolvedId = resolveBankLogoId(iconId, name, institution);

  if (resolvedId === 'none') {
    return null;
  }

  const def = BANK_LOGOS.find((b) => b.id === resolvedId);
  if (!def) {
    return null;
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-lg shadow-sm overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={def.name}
    >
      {def.renderLogo(size)}
    </div>
  );
};

interface BankLogoPickerProps {
  selectedId?: string;
  onSelect: (id: string) => void;
}

export const BankLogoPicker: React.FC<BankLogoPickerProps> = ({
  selectedId = 'none',
  onSelect
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Bank / Institution Logo
        </label>
        <span className="text-[10px] text-slate-500">
          {selectedId === 'none' ? 'No Logo Selected' : BANK_LOGOS.find(b => b.id === selectedId)?.name || 'Custom'}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-[#0a0e14] border border-slate-800 rounded-2xl scrollbar-thin scrollbar-thumb-slate-700">
        {/* "No Logo" Option */}
        <button
          type="button"
          onClick={() => onSelect('none')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
            selectedId === 'none' || !selectedId
              ? 'border-amber-500 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40'
              : 'border-slate-800 bg-[#121820] text-slate-400 hover:text-white hover:border-slate-700'
          }`}
          title="No logo"
        >
          <div className="w-6 h-6 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 mb-1">
            Ø
          </div>
          <span className="text-[10px] font-medium leading-tight truncate w-full">
            No Logo
          </span>
        </button>

        {/* All Bank Logos */}
        {BANK_LOGOS.map((bank) => {
          const isSelected = selectedId === bank.id;
          return (
            <button
              type="button"
              key={bank.id}
              onClick={() => onSelect(bank.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40'
                  : 'border-slate-800 bg-[#121820] hover:border-slate-700'
              }`}
              title={bank.name}
            >
              <div className="mb-1 flex items-center justify-center">
                {bank.renderLogo(28)}
              </div>
              <span className={`text-[10px] font-medium leading-tight truncate w-full ${
                isSelected ? 'text-amber-300 font-bold' : 'text-slate-300'
              }`}>
                {bank.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
