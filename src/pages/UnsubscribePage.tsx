import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Página pública (sin login) para el link "Darme de baja" de los emails.
// Ruta: /u/<unsub_token>
export function UnsubscribePage() {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = window.location.pathname.split('/u/')[1]?.split(/[/?#]/)[0] ?? '';
    if (!token || token === 'demo') { setState('error'); return; }
    supabase.rpc('email_unsubscribe', { p_token: token }).then(({ data, error }) => {
      const ok = !error && (data as any)?.ok;
      if (ok) { setEmail((data as any).email || ''); setState('done'); }
      else setState('error');
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f1ec', fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,.06)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{state === 'done' ? '✅' : state === 'error' ? '⚠️' : '⏳'}</div>
        {state === 'loading' && <p style={{ color: '#555' }}>Procesando tu baja…</p>}
        {state === 'done' && (
          <>
            <h1 style={{ fontSize: 22, color: '#1A1A2E', margin: '0 0 8px' }}>Listo, te diste de baja</h1>
            <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6 }}>
              {email && <b>{email}</b>} ya no recibirá más correos de marketing de B2Better.
              Podés seguir usando la app normalmente.
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 style={{ fontSize: 22, color: '#1A1A2E', margin: '0 0 8px' }}>Link inválido</h1>
            <p style={{ color: '#666', fontSize: 15 }}>Este enlace de baja no es válido o ya expiró.</p>
          </>
        )}
      </div>
    </div>
  );
}
