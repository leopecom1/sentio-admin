import { useState, useEffect } from 'react';
import {
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart,
} from 'recharts';
import { Activity, Users, CalendarDays, CalendarRange } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DayPoint {
  date: string; active_users: number; logins: number;
  checkins: number; journal: number; finance: number; community: number; tools: number; chats: number;
}
interface Summary { total_users: number; dau: number; wau: number; mau: number }

const SECTIONS: { key: keyof DayPoint; label: string; color: string }[] = [
  { key: 'checkins', label: 'Check-ins', color: '#3D5A80' },
  { key: 'journal', label: 'Diario', color: '#7B9E87' },
  { key: 'finance', label: 'Finanzas', color: '#C9A96E' },
  { key: 'community', label: 'Comunidad', color: '#E07A5F' },
  { key: 'tools', label: 'Herramientas', color: '#6C5CE7' },
  { key: 'chats', label: 'Chat IA', color: '#4AA3A2' },
];

const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

const tooltipStyle = { backgroundColor: '#fff', border: '1px solid #E5E5E0', borderRadius: '12px', fontSize: '13px' } as const;

export function UsageMetrics() {
  const [days, setDays] = useState<DayPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [range, setRange] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase.rpc('admin_usage_metrics', { p_days: range }).then(({ data }) => {
      if (!alive || !data) return;
      const d = data as any;
      setDays((d.days as DayPoint[]).map((x) => ({ ...x, date: fmtDate(x.date) })));
      setSummary(d.summary as Summary);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [range]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Panel de uso</h2>
          <p className="text-sm text-text-tertiary">Actividad por sección y usuarios activos</p>
        </div>
        <div className="flex gap-1 bg-card p-1 rounded-xl">
          {[14, 30, 90].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === r ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Resumen DAU/WAU/MAU */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat icon={Activity} label="Activos hoy (DAU)" value={summary?.dau} tint="#3D5A80" />
        <MiniStat icon={CalendarDays} label="Activos 7 días (WAU)" value={summary?.wau} tint="#7B9E87" />
        <MiniStat icon={CalendarRange} label="Activos 30 días (MAU)" value={summary?.mau} tint="#C9A96E" />
        <MiniStat icon={Users} label="Usuarios totales" value={summary?.total_users} tint="#E07A5F" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uso por sección */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Uso por sección (diario)</h3>
          {loading ? <Loading /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {SECTIONS.map((s) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Usuarios activos + aperturas */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          <h3 className="text-lg font-semibold text-text-primary mb-1">Actividad diaria</h3>
          <p className="text-sm text-text-tertiary mb-4">Usuarios activos y aperturas</p>
          {loading ? <Loading h={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="active_users" name="Activos" fill="#3D5A80" fillOpacity={0.15} stroke="#3D5A80" strokeWidth={2} />
                <Bar dataKey="logins" name="Aperturas" fill="#C9A96E" radius={[4, 4, 0, 0]} barSize={10} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <p className="text-[11px] text-text-tertiary mt-2">*Aperturas = inicios de sesión (proxy). El conteo exacto de aperturas requiere instrumentar la app.</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tint }: { icon: any; label: string; value?: number; tint: string }) {
  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint + '22', color: tint }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-text-primary leading-tight">{value ?? '—'}</p>
        <p className="text-xs text-text-tertiary truncate">{label}</p>
      </div>
    </div>
  );
}
function Loading({ h = 280 }: { h?: number }) {
  return <div className="flex items-center justify-center text-text-tertiary" style={{ height: h }}>Cargando...</div>;
}
