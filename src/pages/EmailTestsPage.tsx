import { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type TemplateType = 'welcome' | 'approval' | 'waitlist';

interface Template {
  id: TemplateType;
  title: string;
  subject: string;
  description: string;
  needsName: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: 'welcome',
    title: 'Bienvenida (signup)',
    subject: 'Recibimos tu registro a B2Better',
    description: 'Se envía cuando un usuario se registra. Le avisa que su cuenta está pendiente de aprobación.',
    needsName: true,
  },
  {
    id: 'approval',
    title: 'Cuenta aprobada',
    subject: '¡Tu cuenta de B2Better fue aprobada!',
    description: 'Se envía automáticamente cuando aprobás una cuenta desde "Aprobar cuentas". Incluye CTA para abrir la app.',
    needsName: true,
  },
  {
    id: 'waitlist',
    title: 'Confirmación de waitlist',
    subject: 'Estás en la lista de B2Better',
    description: 'Se envía cuando alguien se anota en la landing page.',
    needsName: false,
  },
];

interface SendState {
  status: 'idle' | 'sending' | 'ok' | 'error';
  message?: string;
  requestId?: number;
}

export function EmailTestsPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('Mateo');
  const [states, setStates] = useState<Record<TemplateType, SendState>>({
    welcome: { status: 'idle' },
    approval: { status: 'idle' },
    waitlist: { status: 'idle' },
  });

  const send = async (type: TemplateType) => {
    if (!email || !email.includes('@')) {
      setStates((s) => ({ ...s, [type]: { status: 'error', message: 'Email inválido' } }));
      return;
    }
    setStates((s) => ({ ...s, [type]: { status: 'sending' } }));
    try {
      const { data, error } = await supabase.rpc('send_test_email', {
        p_type: type,
        p_to: email,
        p_name: name || 'Test',
      });
      if (error) {
        setStates((s) => ({ ...s, [type]: { status: 'error', message: error.message } }));
      } else {
        setStates((s) => ({
          ...s,
          [type]: { status: 'ok', requestId: (data as { request_id?: number })?.request_id },
        }));
      }
    } catch (e) {
      setStates((s) => ({
        ...s,
        [type]: { status: 'error', message: e instanceof Error ? e.message : 'Error desconocido' },
      }));
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Pruebas de email</h1>
        <p className="text-text-secondary mt-1">
          Enviá una versión de prueba de cada template a un email tuyo para revisar diseño y entrega.
        </p>
      </div>

      {/* Inputs */}
      <div className="bg-surface rounded-2xl p-6 border border-border/50 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              Email destino
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-card border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              Nombre (para welcome / approval)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {TEMPLATES.map((t) => {
          const state = states[t.id];
          return (
            <div
              key={t.id}
              className="bg-surface rounded-2xl p-5 border border-border/50 flex flex-col sm:flex-row gap-4 sm:items-center"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-bold text-text-primary">{t.title}</h3>
                  <code className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {t.id}
                  </code>
                </div>
                <p className="text-xs text-text-tertiary font-mono mb-1.5">{t.subject}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{t.description}</p>
                {state.status === 'ok' && (
                  <p className="flex items-center gap-1.5 text-xs text-accent mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Enviado correctamente {state.requestId && `· request #${state.requestId}`}
                  </p>
                )}
                {state.status === 'error' && (
                  <p className="flex items-center gap-1.5 text-xs text-error mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {state.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => send(t.id)}
                disabled={state.status === 'sending' || !email}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-black rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {state.status === 'sending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {state.status === 'sending' ? 'Enviando...' : 'Enviar prueba'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-surface/50 border border-border/40 rounded-xl p-4 text-xs text-text-tertiary leading-relaxed">
        <strong className="text-text-secondary">Cómo funciona:</strong> Cada botón llama al RPC{' '}
        <code className="text-accent">send_test_email</code> en Supabase, que dispara la función real
        que se usa en producción (welcome al signup, approval al aprobar, waitlist al anotarse). Si no
        llega revisá Supabase → Database → Logs.
      </div>
    </div>
  );
}
