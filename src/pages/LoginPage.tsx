import { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export function LoginPage({ onLogin, error, loading }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/logo.svg" alt="B2Better" className="h-9 mx-auto opacity-95" />
          <p className="text-text-secondary mt-4 text-sm tracking-wide">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 shadow-sm border border-border/50">
          {error && (
            <div className="bg-error/5 border border-error/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
              placeholder="admin@sentio.app"
              required
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-text-primary">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
