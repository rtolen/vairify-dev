import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type VAIColorScheme = 
  | 'emerald'
  | 'blue' 
  | 'purple'
  | 'pink'
  | 'orange'
  | 'red'
  | 'cyan'
  | 'amber'
  | 'indigo'
  | 'rose'
  | 'teal'
  | 'lime';

interface VAINumberBadgeProps {
  vaiNumber: string;
  colorScheme?: VAIColorScheme;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPrefix?: boolean;
}

export const getColorScheme = (scheme: VAIColorScheme) => {
  const schemes = {
    emerald: {
      bg: 'bg-emerald-100',
      darkBg: 'dark:bg-emerald-900/30',
      text: 'text-emerald-800',
      darkText: 'dark:text-emerald-200',
      border: 'border-emerald-300',
      darkBorder: 'dark:border-emerald-700',
    },
    blue: {
      bg: 'bg-blue-100',
      darkBg: 'dark:bg-blue-900/30',
      text: 'text-blue-800',
      darkText: 'dark:text-blue-200',
      border: 'border-blue-300',
      darkBorder: 'dark:border-blue-700',
    },
    purple: {
      bg: 'bg-purple-100',
      darkBg: 'dark:bg-purple-900/30',
      text: 'text-purple-800',
      darkText: 'dark:text-purple-200',
      border: 'border-purple-300',
      darkBorder: 'dark:border-purple-700',
    },
    pink: {
      bg: 'bg-pink-100',
      darkBg: 'dark:bg-pink-900/30',
      text: 'text-pink-800',
      darkText: 'dark:text-pink-200',
      border: 'border-pink-300',
      darkBorder: 'dark:border-pink-700',
    },
    orange: {
      bg: 'bg-orange-100',
      darkBg: 'dark:bg-orange-900/30',
      text: 'text-orange-800',
      darkText: 'dark:text-orange-200',
      border: 'border-orange-300',
      darkBorder: 'dark:border-orange-700',
    },
    red: {
      bg: 'bg-red-100',
      darkBg: 'dark:bg-red-900/30',
      text: 'text-red-800',
      darkText: 'dark:text-red-200',
      border: 'border-red-300',
      darkBorder: 'dark:border-red-700',
    },
    cyan: {
      bg: 'bg-cyan-100',
      darkBg: 'dark:bg-cyan-900/30',
      text: 'text-cyan-800',
      darkText: 'dark:text-cyan-200',
      border: 'border-cyan-300',
      darkBorder: 'dark:border-cyan-700',
    },
    amber: {
      bg: 'bg-amber-100',
      darkBg: 'dark:bg-amber-900/30',
      text: 'text-amber-800',
      darkText: 'dark:text-amber-200',
      border: 'border-amber-300',
      darkBorder: 'dark:border-amber-700',
    },
    indigo: {
      bg: 'bg-indigo-100',
      darkBg: 'dark:bg-indigo-900/30',
      text: 'text-indigo-800',
      darkText: 'dark:text-indigo-200',
      border: 'border-indigo-300',
      darkBorder: 'dark:border-indigo-700',
    },
    rose: {
      bg: 'bg-rose-100',
      darkBg: 'dark:bg-rose-900/30',
      text: 'text-rose-800',
      darkText: 'dark:text-rose-200',
      border: 'border-rose-300',
      darkBorder: 'dark:border-rose-700',
    },
    teal: {
      bg: 'bg-teal-100',
      darkBg: 'dark:bg-teal-900/30',
      text: 'text-teal-800',
      darkText: 'dark:text-teal-200',
      border: 'border-teal-300',
      darkBorder: 'dark:border-teal-700',
    },
    lime: {
      bg: 'bg-lime-100',
      darkBg: 'dark:bg-lime-900/30',
      text: 'text-lime-800',
      darkText: 'dark:text-lime-200',
      border: 'border-lime-300',
      darkBorder: 'dark:border-lime-700',
    },
  };

  return schemes[scheme];
};

// Helper function to generate consistent color based on VAI number
export const getVAIColor = (vaiNumber: string): VAIColorScheme => {
  const colors: VAIColorScheme[] = [
    'emerald', 'blue', 'purple', 'pink', 'orange', 
    'red', 'cyan', 'amber', 'indigo', 'rose', 'teal', 'lime'
  ];
  
  // Generate hash from VAI number
  let hash = 0;
  for (let i = 0; i < vaiNumber.length; i++) {
    hash = ((hash << 5) - hash) + vaiNumber.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const VAINumberBadge = ({ 
  vaiNumber, 
  colorScheme, 
  size = 'md', 
  className,
  showPrefix = true 
}: VAINumberBadgeProps) => {
  const scheme = colorScheme || getVAIColor(vaiNumber);
  const colors = getColorScheme(scheme);
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.darkBg,
        colors.text,
        colors.darkText,
        colors.border,
        colors.darkBorder,
        'font-mono font-bold',
        sizeClasses[size],
        className
      )}
    >
      {showPrefix && <span className="mr-1">V.A.I.</span>}
      {vaiNumber}
    </Badge>
  );
};
