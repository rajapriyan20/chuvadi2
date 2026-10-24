import React from 'react';
import {
  IndianRupee,
  CircleDollarSign,
  DollarSign,
  Euro,
  PoundSterling,
  Coins,
  HandCoins,
  Banknote,
  Landmark,
  Building2,
  Building,
  Wallet,
  WalletCards,
  CreditCard,
  Nfc,
  QrCode,
  Smartphone,
  PiggyBank,
  TrendingUp,
  LineChart,
  PieChart,
  Receipt,
  Percent,
  Gem,
  ShieldCheck,
  Vault,
  Car,
  Home,
  GraduationCap,
  Briefcase,
  Tag,
  Bitcoin,
  Scale,
  Gift,
  BadgePercent,
  CircleDot
} from 'lucide-react';

export interface FinanceIconDefinition {
  id: string;
  label: string;
  group: 'Currencies' | 'Banking & Wallets' | 'Savings & Investments' | 'Loans & Assets';
  icon: React.ElementType;
  bgGradient: string;
  accentColor: string;
}

export const FINANCE_ICON_PACK: FinanceIconDefinition[] = [
  // 1. Currencies & Cash
  {
    id: 'fi-rupee',
    label: 'Indian Rupee',
    group: 'Currencies',
    icon: IndianRupee,
    bgGradient: 'from-amber-600/20 to-amber-500/10',
    accentColor: '#f59e0b'
  },
  {
    id: 'fi-dollar-coin',
    label: 'Dollar Coin',
    group: 'Currencies',
    icon: CircleDollarSign,
    bgGradient: 'from-emerald-600/20 to-emerald-500/10',
    accentColor: '#10b981'
  },
  {
    id: 'fi-banknote',
    label: 'Cash Note',
    group: 'Currencies',
    icon: Banknote,
    bgGradient: 'from-emerald-600/20 to-teal-500/10',
    accentColor: '#14b8a6'
  },
  {
    id: 'fi-coins',
    label: 'Gold Coins',
    group: 'Currencies',
    icon: Coins,
    bgGradient: 'from-amber-500/20 to-yellow-500/10',
    accentColor: '#eab308'
  },
  {
    id: 'fi-hand-coins',
    label: 'Coins in Hand',
    group: 'Currencies',
    icon: HandCoins,
    bgGradient: 'from-amber-600/20 to-orange-500/10',
    accentColor: '#f97316'
  },
  {
    id: 'fi-euro',
    label: 'Euro Symbol',
    group: 'Currencies',
    icon: Euro,
    bgGradient: 'from-blue-600/20 to-indigo-500/10',
    accentColor: '#3b82f6'
  },
  {
    id: 'fi-pound',
    label: 'British Pound',
    group: 'Currencies',
    icon: PoundSterling,
    bgGradient: 'from-indigo-600/20 to-violet-500/10',
    accentColor: '#6366f1'
  },
  {
    id: 'fi-crypto',
    label: 'Bitcoin Crypto',
    group: 'Currencies',
    icon: Bitcoin,
    bgGradient: 'from-amber-600/20 to-orange-500/10',
    accentColor: '#f59e0b'
  },

  // 2. Banking & Wallets
  {
    id: 'fi-landmark',
    label: 'Bank Pillar',
    group: 'Banking & Wallets',
    icon: Landmark,
    bgGradient: 'from-blue-600/20 to-cyan-500/10',
    accentColor: '#0284c7'
  },
  {
    id: 'fi-building',
    label: 'Commercial Bank',
    group: 'Banking & Wallets',
    icon: Building2,
    bgGradient: 'from-slate-600/20 to-slate-500/10',
    accentColor: '#94a3b8'
  },
  {
    id: 'fi-wallet',
    label: 'Pocket Wallet',
    group: 'Banking & Wallets',
    icon: Wallet,
    bgGradient: 'from-emerald-600/20 to-green-500/10',
    accentColor: '#10b981'
  },
  {
    id: 'fi-wallet-cards',
    label: 'Wallet & Cards',
    group: 'Banking & Wallets',
    icon: WalletCards,
    bgGradient: 'from-teal-600/20 to-emerald-500/10',
    accentColor: '#14b8a6'
  },
  {
    id: 'fi-card',
    label: 'Credit / Debit Card',
    group: 'Banking & Wallets',
    icon: CreditCard,
    bgGradient: 'from-rose-600/20 to-pink-500/10',
    accentColor: '#f43f5e'
  },
  {
    id: 'fi-contactless',
    label: 'Contactless Tap',
    group: 'Banking & Wallets',
    icon: Nfc,
    bgGradient: 'from-violet-600/20 to-purple-500/10',
    accentColor: '#8b5cf6'
  },
  {
    id: 'fi-qr',
    label: 'QR Scan & Pay',
    group: 'Banking & Wallets',
    icon: QrCode,
    bgGradient: 'from-cyan-600/20 to-blue-500/10',
    accentColor: '#06b6d4'
  },
  {
    id: 'fi-upi',
    label: 'Mobile UPI App',
    group: 'Banking & Wallets',
    icon: Smartphone,
    bgGradient: 'from-sky-600/20 to-indigo-500/10',
    accentColor: '#38bdf8'
  },

  // 3. Savings & Investments
  {
    id: 'fi-piggy',
    label: 'Piggy Bank',
    group: 'Savings & Investments',
    icon: PiggyBank,
    bgGradient: 'from-pink-600/20 to-rose-500/10',
    accentColor: '#ec4899'
  },
  {
    id: 'fi-growth',
    label: 'Stock Growth',
    group: 'Savings & Investments',
    icon: TrendingUp,
    bgGradient: 'from-emerald-600/20 to-teal-500/10',
    accentColor: '#10b981'
  },
  {
    id: 'fi-chart',
    label: 'Market Chart',
    group: 'Savings & Investments',
    icon: LineChart,
    bgGradient: 'from-violet-600/20 to-indigo-500/10',
    accentColor: '#8b5cf6'
  },
  {
    id: 'fi-mutual-funds',
    label: 'Mutual Funds / Portfolio',
    group: 'Savings & Investments',
    icon: PieChart,
    bgGradient: 'from-indigo-600/20 to-blue-500/10',
    accentColor: '#6366f1'
  },
  {
    id: 'fi-vault',
    label: 'Safe Deposit Vault',
    group: 'Savings & Investments',
    icon: Vault,
    bgGradient: 'from-amber-600/20 to-yellow-500/10',
    accentColor: '#eab308'
  },
  {
    id: 'fi-shield',
    label: 'Insurance & Safety',
    group: 'Savings & Investments',
    icon: ShieldCheck,
    bgGradient: 'from-emerald-600/20 to-cyan-500/10',
    accentColor: '#10b981'
  },
  {
    id: 'fi-gem',
    label: 'Gold & Diamond Gem',
    group: 'Savings & Investments',
    icon: Gem,
    bgGradient: 'from-cyan-600/20 to-teal-500/10',
    accentColor: '#06b6d4'
  },
  {
    id: 'fi-interest',
    label: 'Fixed Deposit (FD)',
    group: 'Savings & Investments',
    icon: Percent,
    bgGradient: 'from-amber-600/20 to-orange-500/10',
    accentColor: '#f59e0b'
  },

  // 4. Loans & Assets
  {
    id: 'fi-car-loan',
    label: 'Vehicle / Auto Loan',
    group: 'Loans & Assets',
    icon: Car,
    bgGradient: 'from-orange-600/20 to-amber-500/10',
    accentColor: '#ea580c'
  },
  {
    id: 'fi-home-loan',
    label: 'Home Loan / Property',
    group: 'Loans & Assets',
    icon: Home,
    bgGradient: 'from-sky-600/20 to-blue-500/10',
    accentColor: '#0284c7'
  },
  {
    id: 'fi-edu-loan',
    label: 'Education Loan',
    group: 'Loans & Assets',
    icon: GraduationCap,
    bgGradient: 'from-purple-600/20 to-violet-500/10',
    accentColor: '#a855f7'
  },
  {
    id: 'fi-business',
    label: 'Business / Current Account',
    group: 'Loans & Assets',
    icon: Briefcase,
    bgGradient: 'from-slate-600/20 to-zinc-500/10',
    accentColor: '#94a3b8'
  },
  {
    id: 'fi-receipt',
    label: 'Ledger / Passbook',
    group: 'Loans & Assets',
    icon: Receipt,
    bgGradient: 'from-amber-600/20 to-yellow-500/10',
    accentColor: '#f59e0b'
  },
  {
    id: 'fi-tag',
    label: 'Tag / Rewards',
    group: 'Loans & Assets',
    icon: Tag,
    bgGradient: 'from-pink-600/20 to-rose-500/10',
    accentColor: '#f43f5e'
  },
  {
    id: 'fi-gift',
    label: 'Cashback & Voucher',
    group: 'Loans & Assets',
    icon: Gift,
    bgGradient: 'from-rose-600/20 to-pink-500/10',
    accentColor: '#fb7185'
  },
  {
    id: 'fi-scale',
    label: 'Balance & Audit',
    group: 'Loans & Assets',
    icon: Scale,
    bgGradient: 'from-blue-600/20 to-cyan-500/10',
    accentColor: '#38bdf8'
  }
];

export const FINANCE_ICONS_BY_ID = new Map<string, FinanceIconDefinition>(
  FINANCE_ICON_PACK.map(iconDef => [iconDef.id, iconDef])
);

export function isFinanceIconId(id?: string): boolean {
  if (!id) return false;
  return id.startsWith('fi-') && FINANCE_ICONS_BY_ID.has(id);
}

export function getFinanceIconDefinition(id?: string): FinanceIconDefinition | undefined {
  if (!id) return undefined;
  return FINANCE_ICONS_BY_ID.get(id);
}

interface FinanceIconProps {
  id: string;
  size?: number;
  className?: string;
  color?: string;
}

export const FinanceIcon: React.FC<FinanceIconProps> = ({
  id,
  size = 22,
  className = '',
  color
}) => {
  const iconDef = getFinanceIconDefinition(id);
  if (!iconDef) return null;

  const IconComp = iconDef.icon;
  const iconSize = Math.max(12, Math.round(size * 0.65));

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br ${iconDef.bgGradient} border border-slate-700/60 shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        color: color || iconDef.accentColor
      }}
      title={iconDef.label}
    >
      <IconComp size={iconSize} strokeWidth={2.2} />
    </div>
  );
};
