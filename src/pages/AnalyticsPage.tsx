import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAnalytics, useDashboardStats } from '../hooks/useSupabaseData';

const FEATURE_LABELS: Record<string, string> = {
  breathing: 'Respiración',
  pause: 'Pausas',
  anxiety: 'Ansiedad',
  entrepreneur: 'Emprendedor',
};

export function AnalyticsPage() {
  const analytics = useAnalytics();
  const stats = useDashboardStats();

  const featureData = analytics.featureUsage.map((f) => ({
    feature: FEATURE_LABELS[f.tool_category] ?? f.tool_category,
    uses: f.count,
  }));

  const avgStress = analytics.stressTrend.filter(s => s.avg > 0);
  const avgStressValue = avgStress.length > 0
    ? (avgStress.reduce((acc, s) => acc + s.avg, 0) / avgStress.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Analíticas</h1>
        <p className="text-text-secondary mt-1">Métricas de uso y bienestar de la plataforma</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <p className="text-xs text-text-tertiary font-medium uppercase">Usuarios totales</p>
          <p className="text-2xl font-bold mt-1">{stats.loading ? '...' : stats.totalUsers}</p>
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <p className="text-xs text-text-tertiary font-medium uppercase">Check-ins hoy</p>
          <p className="text-2xl font-bold mt-1">{stats.loading ? '...' : stats.todayCheckins}</p>
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <p className="text-xs text-text-tertiary font-medium uppercase">Estrés promedio (7d)</p>
          <p className="text-2xl font-bold mt-1">
            {analytics.loading ? '...' : `${avgStressValue}/5`}
          </p>
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <p className="text-xs text-text-tertiary font-medium uppercase">Crisis hoy</p>
          <p className={`text-2xl font-bold mt-1 ${stats.crisisCount > 0 ? 'text-error' : ''}`}>
            {stats.loading ? '...' : stats.crisisCount}
          </p>
        </div>
      </div>

      {/* Daily Check-ins Chart */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Check-ins diarios (últimos 7 días)</h3>
        {analytics.loading ? (
          <div className="h-[300px] flex items-center justify-center text-text-tertiary">Cargando...</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dailyCheckins}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E5E0',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="count" fill="#3D5A80" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Feature Usage */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Uso de herramientas (7 días)</h3>
          {analytics.loading ? (
            <div className="h-[250px] flex items-center justify-center text-text-tertiary">Cargando...</div>
          ) : featureData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-text-tertiary text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="feature" type="category" stroke="#9CA3AF" fontSize={12} width={80} />
                <Tooltip />
                <Bar dataKey="uses" fill="#3D5A80" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stress Trend */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Tendencia de estrés</h3>
          {analytics.loading ? (
            <div className="h-[250px] flex items-center justify-center text-text-tertiary">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.stressTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis domain={[0, 5]} stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#D4A574"
                  strokeWidth={2}
                  dot={{ fill: '#D4A574', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Emotion Distribution */}
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Distribución de emociones (7 días)</h3>
        {analytics.loading ? (
          <div className="h-48 flex items-center justify-center text-text-tertiary">Cargando...</div>
        ) : analytics.emotionDistribution.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-text-tertiary text-sm">Sin datos aún</div>
        ) : (
          <div className="flex items-end gap-4 h-48">
            {analytics.emotionDistribution.map((item) => {
              const maxCount = Math.max(...analytics.emotionDistribution.map(d => d.value));
              const height = maxCount > 0 ? (item.value / maxCount) * 100 : 0;
              return (
                <div key={item.name} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{item.value}</span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${height}%`,
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="text-xs text-text-tertiary text-center">{item.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
