interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  trend?: 'up' | 'down' | 'stable';
}

export function MetricCard({ title, value, icon, color = 'blue', trend }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
  };

  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 hover:scale-105 transition-transform`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {trend && <span className="text-lg">{trendIcons[trend]}</span>}
      </div>

      <div className="space-y-1">
        <div className="text-sm text-jarvis-text-secondary">{title}</div>
        <div className="text-2xl font-bold text-jarvis-text">{value}</div>
      </div>
    </div>
  );
}
