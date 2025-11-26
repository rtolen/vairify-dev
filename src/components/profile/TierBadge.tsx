import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TierType = 'founding_council' | 'first_movers' | 'early_access' | 'standard' | null;

interface TierBadgeProps {
  tier: TierType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const getTierInfo = (tier: TierType) => {
  switch (tier) {
    case 'founding_council':
      return {
        name: 'Founding Council',
        shortName: 'FC',
        emoji: '🔥',
        gradient: 'from-yellow-400 via-yellow-500 to-amber-600',
        bgColor: 'bg-[#FEF3C7]',
        darkBgColor: 'dark:bg-yellow-900/20',
        textColor: 'text-[#B45309]',
        darkTextColor: 'dark:text-yellow-500',
        borderColor: 'border-yellow-500/20',
        solidBg: 'bg-yellow-50',
        darkSolidBg: 'dark:bg-yellow-900/30',
      };
    case 'first_movers':
      return {
        name: 'First Movers',
        shortName: 'FM',
        emoji: '⚡',
        gradient: 'from-purple-400 via-purple-500 to-indigo-600',
        bgColor: 'bg-[#EDE9FE]',
        darkBgColor: 'dark:bg-purple-900/20',
        textColor: 'text-[#7C3AED]',
        darkTextColor: 'dark:text-purple-400',
        borderColor: 'border-purple-500/20',
        solidBg: 'bg-purple-50',
        darkSolidBg: 'dark:bg-purple-900/30',
      };
    case 'early_access':
      return {
        name: 'Early Access',
        shortName: 'EA',
        emoji: '🚀',
        gradient: 'from-pink-400 via-purple-400 to-indigo-400',
        bgColor: 'bg-[#FAE8FF]',
        darkBgColor: 'dark:bg-pink-900/20',
        textColor: 'text-[#C026D3]',
        darkTextColor: 'dark:text-pink-400',
        borderColor: 'border-pink-500/20',
        solidBg: 'bg-pink-50',
        darkSolidBg: 'dark:bg-pink-900/30',
      };
    case 'standard':
      return {
        name: 'Public Standard',
        shortName: 'PS',
        emoji: '📋',
        gradient: 'from-gray-400 via-gray-500 to-gray-600',
        bgColor: 'bg-[#F3F4F6]',
        darkBgColor: 'dark:bg-gray-800/20',
        textColor: 'text-[#6B7280]',
        darkTextColor: 'dark:text-gray-400',
        borderColor: 'border-gray-500/20',
        solidBg: 'bg-gray-50',
        darkSolidBg: 'dark:bg-gray-800/30',
      };
    default:
      return null;
  }
};

export const TierBadge = ({ tier, size = 'md', showIcon = true, iconOnly = false, className }: TierBadgeProps) => {
  const tierInfo = getTierInfo(tier);
  
  if (!tierInfo) return null;
  
  const sizeClasses = {
    sm: iconOnly ? 'w-8 h-8 text-base' : 'px-3 py-1 text-xs',
    md: iconOnly ? 'w-10 h-10 text-lg' : 'px-4 py-1.5 text-sm',
    lg: iconOnly ? 'w-12 h-12 text-xl' : 'px-5 py-2 text-base',
  };

  if (iconOnly) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-medium',
          tierInfo.solidBg,
          tierInfo.darkSolidBg,
          sizeClasses[size],
          className
        )}
        title={tierInfo.name}
      >
        {tierInfo.emoji}
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        tierInfo.bgColor,
        tierInfo.darkBgColor,
        tierInfo.textColor,
        tierInfo.darkTextColor,
        tierInfo.borderColor,
        'font-semibold',
        sizeClasses[size],
        'gap-1.5',
        className
      )}
    >
      {showIcon && <span>{tierInfo.emoji}</span>}
      {tierInfo.name}
    </Badge>
  );
};
