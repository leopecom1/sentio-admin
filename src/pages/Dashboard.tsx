import {
  Users,
  CheckCircle,
  BookOpen,
  MessageSquare,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { EMOTIONS } from '../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useDashboardStats, useAnalytics, useUsers } from '../hooks/useSupabaseData';

export function Dashboard() {
  const stats = useDashboardStats();
  const analytics = useAnalytics();
  const { users } = useUsers();

  const recentUsers = users.slice(0, 5);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Resumen de actividad de Sentio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Usuarios totales"
          value={stats.loading ? '...' : stats.totalUsers.toLocaleString('es-AR')}
          icon={Users}
          color="#3D5A80"
        />
        <StatCard
          title="Check-ins hoy"
          value={stats.loading ? '...' : stats.todayCheckins.toLocaleString('es-AR')}
          icon={CheckCircle}
          color="#7B9E87"
        />
        <StatCard
          title="Entradas de diario"
          value={stats.loading ? '...' : stats.todayJournals.toLocaleString('es-AR')}
          subtitle="hoy"
          icon={BookOpen}
          color="#C9A96E"
        />
        <StatCard
          title="Conversaciones IA"
          value={stats.loading ? '...' : stats.weekConversations.toLocaleString('es-AR')}
          subtitle="esta semana"
          icon={MessageSquare}
          color="#5B7BA5"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Check-ins */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Check-ins por día</h3>
          {analytics.loading ? (
            <div className="h-[250px] flex items-center justify-center text-text-tertiary">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.dailyCheckins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E5E0',
                    borderRadius: '12px',
                    fontSize: '14px',
                  }}
                />
                <Bar dataKey="count" fill="#3D5A80" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Emotion Distribution */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Emociones reportadas</h3>
          {analytics.loading ? (
            <div className="h-[200px] flex items-center justify-center text-text-tertiary">Cargando...</div>
          ) : analytics.emotionDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-text-tertiary text-sm">Sin datos aún</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.emotionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.emotionDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {analytics.emotionDistribution.map((item) => (
                  <span key={item.name} className="text-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stress Trend & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stress Trend */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-1">Estrés promedio</h3>
          <p className="text-sm text-text-tertiary mb-4">Últimos 7 días</p>
          {analytics.loading ? (
            <div className="h-[180px] flex items-center justify-center text-text-tertiary">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={analytics.stressTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis domain={[1, 5]} stroke="#9CA3AF" fontSize={12} />
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

        {/* Recent Users */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Usuarios recientes</h3>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-text-tertiary py-8 text-center">Sin usuarios aún</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => {
                const emotion = user.last_emotion ? EMOTIONS[user.last_emotion] : null;
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                        {(user.full_name ?? '?').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{user.full_name ?? 'Sin nombre'}</p>
                        <p className="text-xs text-text-tertiary">{user.plan === 'premium' ? 'Premium' : 'Gratuito'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {emotion && (
                        <span className="text-lg" title={emotion.label}>
                          {emotion.emoji}
                        </span>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary">
                          {user.last_active_at
                            ? new Date(user.last_active_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                            : 'Nunca'}
                        </p>
                        {user.checkin_streak > 0 && (
                          <p className="text-xs text-accent font-medium">🔥 {user.checkin_streak} días</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {stats.crisisCount > 0 && (
          <div className="bg-error/5 border border-error/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-error" />
              <h4 className="font-semibold text-error">Alertas de crisis</h4>
            </div>
            <p className="text-sm text-text-secondary">
              {stats.crisisCount} usuario{stats.crisisCount > 1 ? 's' : ''} reportó estrés 5/5 con energía 1/5 hoy.
              Se activó el flujo de contención automático.
            </p>
          </div>
        )}
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h4 className="font-semibold text-accent">Plataforma activa</h4>
          </div>
          <p className="text-sm text-text-secondary">
            {stats.totalUsers} usuarios registrados. {stats.todayCheckins} check-ins completados hoy.
          </p>
        </div>
      </div>
    </div>
  );
}
