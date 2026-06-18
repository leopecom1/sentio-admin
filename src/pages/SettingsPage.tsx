import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Save, Bell, Sparkles, Smartphone, RefreshCw, BookOpen,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const CONFIG_KEYS = [
  'ios_store_url',
  'android_store_url',
  'min_ios_version',
  'min_android_version',
  'ai_system_prompt',
  'ai_model',
  'ai_temperature',
] as const;

type ConfigKey = (typeof CONFIG_KEYS)[number];

const AI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'];

/**
 * Configuración de la app (tabla `app_config`): links de tienda, force update
 * y ajustes del asistente IA (personalidad, modelo, temperatura). Todo editable
 * sin redeploy — la app y la landing lo leen al instante.
 */
function AppConfigSection() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', CONFIG_KEYS as unknown as string[]);
      if (!error && data) {
        const m: Record<string, string> = {};
        (data as { key: string; value: string | null }[]).forEach((r) => {
          m[r.key] = r.value ?? '';
        });
        setValues(m);
      } else if (error) {
        setStatus({ type: 'error', msg: error.message });
      }
      setLoading(false);
    })();
  }, []);

  const set = (k: ConfigKey, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const rows = CONFIG_KEYS.map((k) => ({
      key: k,
      value: (values[k] ?? '').trim(),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('app_config').upsert(rows, { onConflict: 'key' });
    if (error) setStatus({ type: 'error', msg: error.message });
    else setStatus({ type: 'ok', msg: 'Cambios guardados. La app y la landing los toman al instante.' });
    setSaving(false);
  };

  const input = (k: ConfigKey, placeholder: string) => (
    <input
      type="text"
      value={values[k] ?? ''}
      onChange={(e) => set(k, e.target.value)}
      placeholder={placeholder}
      disabled={loading}
      className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
    />
  );

  return (
    <>
      {/* Links de tienda */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Links de las tiendas</h3>
        </div>
        <p className="text-xs text-text-tertiary mb-4">
          Los usan los botones de descarga de la landing y la pantalla de actualización de la app.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">App Store (iOS)</label>
            {input('ios_store_url', 'https://apps.apple.com/app/id...')}
          </div>
          <div>
            <label className="text-sm font-medium">Google Play (Android)</label>
            {input('android_store_url', 'https://play.google.com/store/apps/details?id=...')}
          </div>
        </div>
      </section>

      {/* Forced update */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Actualización obligatoria</h3>
        </div>
        <p className="text-xs text-text-tertiary mb-4">
          Versión mínima soportada. Quien tenga una versión <strong>menor</strong> verá una pantalla
          bloqueante que lo obliga a actualizar. Subí el número cuando publiques una versión que querés forzar.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Mínimo iOS</label>
            {input('min_ios_version', '1.0.0')}
          </div>
          <div>
            <label className="text-sm font-medium">Mínimo Android</label>
            {input('min_android_version', '1.0.0')}
          </div>
        </div>
        <p className="text-xs text-text-tertiary mt-3">
          Formato: <code className="text-accent">mayor.menor.patch</code> (ej. <code className="text-accent">1.1.0</code>).
          Ignora el build (+N). Dejalo en la versión actual para no bloquear a nadie.
        </p>
      </section>

      {/* Asistente IA */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Asistente IA</h3>
          </div>
          <Link
            to="/wiki"
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Base de conocimiento →
          </Link>
        </div>
        <p className="text-xs text-text-tertiary mb-4">
          Personalidad y parámetros del asistente del chat. Se aplican sin redeploy.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Personalidad (system prompt)</label>
            <textarea
              value={values['ai_system_prompt'] ?? ''}
              onChange={(e) => set('ai_system_prompt', e.target.value)}
              disabled={loading}
              rows={10}
              placeholder="Cómo se comporta el asistente..."
              className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary leading-relaxed focus:outline-none focus:border-primary disabled:opacity-50 resize-y"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Definí tono, estilo y límites. La app le suma el contexto del usuario y la base de conocimiento.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Modelo</label>
              <select
                value={values['ai_model'] || 'gpt-4o-mini'}
                onChange={(e) => set('ai_model', e.target.value)}
                disabled={loading}
                className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
              >
                {AI_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="text-xs text-text-tertiary mt-1">gpt-4o es más capaz; mini es más barato/rápido.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Temperatura</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1.5"
                value={values['ai_temperature'] ?? '0.7'}
                onChange={(e) => set('ai_temperature', e.target.value)}
                disabled={loading}
                className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <p className="text-xs text-text-tertiary mt-1">Más alta = más creativa; más baja = más enfocada (0.5–0.8).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Estado + guardar */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={save}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
        {status && (
          <span
            className={`flex items-center gap-1.5 text-sm ${
              status.type === 'ok' ? 'text-accent' : 'text-error'
            }`}
          >
            {status.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {status.msg}
          </span>
        )}
      </div>
    </>
  );
}

export function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
        <p className="text-text-secondary mt-1">Ajustes de la app y la plataforma</p>
      </div>

      <AppConfigSection />

      {/* Notifications (placeholder visual) */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Notificaciones</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Recordatorio de check-in matutino</p>
              <p className="text-xs text-text-tertiary">Enviar a las 8:00 AM del usuario</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Alertas de crisis</p>
              <p className="text-xs text-text-tertiary">Notificar al admin cuando se detecta una crisis</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
