import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = '#3D5A80' }: StatCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-text-primary">{value}</p>
          {subtitle && (
            <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 font-medium ${trend.value >= 0 ? 'text-accent' : 'text-error'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
