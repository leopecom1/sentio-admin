import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Pencil, X, Loader2, Save, CheckCircle2, AlertCircle,
  Zap, Send, BarChart2, Clock, Mail, Smartphone, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Template {
  key: string;
  title: string;
  body: string;
  category: string;
  icon: string | null;
  color: string | null;
  push_default: boolean;
  email_default: boolean;
  cooldown_minutes: number;
  is_active: boolean;
}

interface Rule {
  key: string;
  template_key: string;
  description: string | null;
  trigger_type: string;
  params: Record<string, unknown>;
  is_active: boolean;
}

interface LogRow { template_key: string; channels: string[]; created_at: string; }

type Tab = 'templates' | 'rules' | 'broadcast';

const CATEGORIES: Record<string, { label: string; color: string }> = {
  habitos: { label: 'Hábitos', color: '#3030FF' },
  comunidad: { label: 'Comunidad', color: '#FF6B9D' },
  reactivacion: { label: 'Reactivación', color: '#C9A96E' },
  progreso: { label: 'Progreso', color: '#00FFBD' },
};

const TRIGGER_LABELS: Record<string, string> = {
  no_checkin: 'No registró check-in hoy',
  streak_danger: 'Racha en peligro',
  daily_goals_pending: 'Metas diarias pendientes',
  no_journal: 'Sin diario en N días',
  inactivity: 'Inactividad de N días',
};

export function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const [broadcastKey, setBroadcastKey] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, r, l] = await Promise.all([
      supabase.from('notification_templates').select('*').order('category').order('key'),
      supabase.from('automation_rules').select('*').order('key'),
      supabase.from('notification_log').select('template_key, channels, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString()),
    ]);
    if (t.error) setStatus({ type: 'error', msg: t.error.message });
    setTemplates((t.data as Template[]) || []);
    setRules((r.data as Rule[]) || []);
    setLogs((l.data as LogRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveTemplate = async () => {
    if (!draft) return;
    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from('notification_templates').update({
      title: draft.title.trim(),
      body: draft.body.trim(),
      icon: draft.icon,
      color: draft.color,
      push_default: draft.push_default,
      email_default: draft.email_default,
      cooldown_minutes: Number(draft.cooldown_minutes) || 0,
      is_active: draft.is_active,
      updated_at: new Date().toISOString(),
    }).eq('key', draft.key);
    setSaving(false);
    if (error) setStatus({ type: 'error', msg: error.message });
    else { setStatus({ type: 'ok', msg: 'Plantilla guardada.' }); setDraft(null); load(); }
  };

  const toggleRule = async (rule: Rule) => {
    const next = !rule.is_active;
    if (next && !confirm(
      `Vas a ACTIVAR "${rule.description}". A partir de las 22:00 UTC se enviará automáticamente a todos los usuarios que cumplan la condición. ¿Confirmás?`
    )) return;
    const { error } = await supabase.from('automation_rules')
      .update({ is_active: next, updated_at: new Date().toISOString() }).eq('key', rule.key);
    if (error) setStatus({ type: 'error', msg: error.message });
    else load();
  };

  const setRuleDays = async (rule: Rule, days: number) => {
    const { error } = await supabase.from('automation_rules')
      .update({ params: { ...rule.params, days }, updated_at: new Date().toISOString() })
      .eq('key', rule.key);
    if (error) setStatus({ type: 'error', msg: error.message }); else load();
  };

  const broadcast = async () => {
    if (!broadcastKey) return;
    const tpl = templates.find((t) => t.key === broadcastKey);
    if (!confirm(`Enviar "${tpl?.title}" ahora a TODOS los usuarios con onboarding completo. ¿Confirmás?`)) return;
    setSending(true);
    setStatus(null);
    const { data, error } = await supabase.rpc('admin_broadcast', { p_template_key: broadcastKey });
    setSending(false);
    if (error) setStatus({ type: 'error', msg: error.message });
    else { setStatus({ type: 'ok', msg: `Enviado a ${data} usuarios (respetando preferencias y cooldown).` }); load(); }
  };

  // métricas
  const total = logs.length;
  const byChannel = { in_app: 0, email: 0, push: 0 };
  logs.forEach((l) => (l.channels || []).forEach((c) => { if (c in byChannel) (byChannel as Record<string, number>)[c]++; }));
  const byTpl = logs.reduce<Record<string, number>>((a, l) => { a[l.template_key] = (a[l.template_key] || 0) + 1; return a; }, {});

  const field = 'mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary';

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" /> Notificaciones
        </h1>
        <p className="text-text-secondary mt-1">
          Plantillas, automatizaciones y envíos. Los usuarios eligen qué recibir desde la app.
        </p>
      </div>

      {/* Métricas (últimos 30 días) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: BarChart2, label: 'Enviadas (30d)', val: total },
          { icon: Bell, label: 'In-app', val: byChannel.in_app },
          { icon: Mail, label: 'Email', val: byChannel.email },
          { icon: Smartphone, label: 'Push', val: byChannel.push },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} className="bg-surface rounded-2xl p-4 border border-border/50">
            <Icon className="w-4 h-4 text-text-tertiary mb-2" />
            <p className="text-2xl font-bold text-text-primary">{val}</p>
            <p className="text-xs text-text-tertiary">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-xl p-1 w-fit">
        {([['templates', 'Plantillas', Pencil], ['rules', 'Automatizaciones', Zap], ['broadcast', 'Envío manual', Send]] as const).map(
          ([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          )
        )}
      </div>

      {status && (
        <div className={`flex items-center gap-2 text-sm mb-5 px-4 py-3 rounded-xl border ${
          status.type === 'ok' ? 'text-accent border-accent/30 bg-accent/5' : 'text-error border-error/30 bg-error/5'
        }`}>
          {status.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : tab === 'templates' ? (
        <div className="space-y-3">
          {templates.map((t) => {
            const cat = CATEGORIES[t.category] || { label: t.category, color: '#888' };
            return (
              <div key={t.key} className={`bg-surface rounded-2xl p-5 border border-border/50 ${!t.is_active ? 'opacity-55' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ color: cat.color, background: `${cat.color}1a` }}>{cat.label}</span>
                      <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                        <Clock className="w-3 h-3" /> cooldown {t.cooldown_minutes}m
                      </span>
                      {t.push_default && <span className="text-[10px] text-text-tertiary flex items-center gap-1"><Smartphone className="w-3 h-3" />push</span>}
                      {t.email_default && <span className="text-[10px] text-text-tertiary flex items-center gap-1"><Mail className="w-3 h-3" />email</span>}
                      <span className="text-[10px] text-text-tertiary font-mono">{t.key}</span>
                    </div>
                    <h3 className="text-base font-bold text-text-primary truncate">{t.title}</h3>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{t.body}</p>
                    <p className="text-xs text-text-tertiary mt-2">{byTpl[t.key] || 0} enviadas (30d)</p>
                  </div>
                  <button onClick={() => setDraft({ ...t })} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card shrink-0" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : tab === 'rules' ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl border text-amber-600 border-amber-300/40 bg-amber-50/40">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Las reglas se ejecutan automáticamente cada día a las 22:00 UTC. Al activarlas, se envían a todos los usuarios que cumplan la condición.</span>
          </div>
          {rules.map((r) => (
            <div key={r.key} className={`bg-surface rounded-2xl p-5 border border-border/50 ${!r.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-text-primary">{r.description}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{TRIGGER_LABELS[r.trigger_type] || r.trigger_type}</p>
                  {(r.trigger_type === 'no_journal' || r.trigger_type === 'inactivity') && (
                    <label className="flex items-center gap-2 text-xs text-text-tertiary mt-2">
                      Días:
                      <input type="number" min={1} defaultValue={Number(r.params?.days) || (r.trigger_type === 'inactivity' ? 5 : 3)}
                        onBlur={(e) => setRuleDays(r, Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-card border border-border rounded-lg text-text-primary" />
                    </label>
                  )}
                </div>
                <button onClick={() => toggleRule(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                    r.is_active ? 'text-accent bg-accent/10' : 'text-text-tertiary bg-card'
                  }`}>
                  {r.is_active ? 'Activa' : 'Pausada'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-6 border border-border/50 max-w-lg">
          <h3 className="text-lg font-semibold mb-1">Envío manual</h3>
          <p className="text-sm text-text-secondary mb-4">
            Mandá una plantilla ahora a todos los usuarios. Respeta las preferencias de cada uno y el cooldown.
          </p>
          <select className={field} value={broadcastKey} onChange={(e) => setBroadcastKey(e.target.value)}>
            <option value="">Elegí una plantilla…</option>
            {templates.filter((t) => t.is_active).map((t) => (
              <option key={t.key} value={t.key}>{t.title}</option>
            ))}
          </select>
          <button onClick={broadcast} disabled={!broadcastKey || sending}
            className="flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar ahora
          </button>
        </div>
      )}

      {/* Editor de plantilla */}
      {draft && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setDraft(null)}>
          <div className="bg-surface rounded-2xl p-6 border border-border/50 w-full max-w-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar plantilla</h3>
              <button onClick={() => setDraft(null)} className="text-text-tertiary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <input className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <p className="text-xs text-text-tertiary mt-1">Variables: {'{nombre}'}, {'{racha}'}, {'{quien}'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Mensaje</label>
                <textarea className={`${field} resize-y`} rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cooldown (min)</label>
                  <input type="number" className={field} value={draft.cooldown_minutes} onChange={(e) => setDraft({ ...draft, cooldown_minutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <input className={field} value={draft.color || ''} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="#3030FF" />
                </div>
              </div>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={draft.push_default} onChange={(e) => setDraft({ ...draft, push_default: e.target.checked })} className="w-4 h-4 accent-[var(--color-primary)]" />
                  Push por defecto
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={draft.email_default} onChange={(e) => setDraft({ ...draft, email_default: e.target.checked })} className="w-4 h-4 accent-[var(--color-primary)]" />
                  Email por defecto
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--color-primary)]" />
                  Activa
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={saveTemplate} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
              </button>
              <button onClick={() => setDraft(null)} className="px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
