import { Save, Bell, Shield, Database } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
        <p className="text-text-secondary mt-1">Ajustes generales de la plataforma</p>
      </div>

      {/* Notifications */}
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
              <p className="text-sm font-medium">Recordatorio de check-in nocturno</p>
              <p className="text-xs text-text-tertiary">Enviar a las 9:00 PM del usuario</p>
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

      {/* AI Configuration */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Asistente IA</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tono del asistente</label>
            <select className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary">
              <option>Cálido y empático (recomendado)</option>
              <option>Directo y profesional</option>
              <option>Suave y gentil</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Límite de mensajes (plan gratuito)</label>
            <input
              type="number"
              defaultValue={3}
              className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-text-tertiary mt-1">Conversaciones por mes para plan gratuito</p>
          </div>
          <div>
            <label className="text-sm font-medium">Detección de crisis</label>
            <p className="text-xs text-text-tertiary mt-1">
              Se activa automáticamente cuando el estrés es 5/5 y la energía 1/5, o cuando se detectan palabras clave de riesgo.
            </p>
          </div>
        </div>
      </section>

      {/* Database */}
      <section className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Base de datos</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Supabase URL</label>
            <input
              type="text"
              placeholder="https://xxxxx.supabase.co"
              className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Supabase Anon Key</label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors">
        <Save className="w-4 h-4" />
        Guardar cambios
      </button>
    </div>
  );
}
