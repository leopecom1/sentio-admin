import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, Mail, UserX, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Filter = 'pending' | 'approved';

interface ApprovalProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_approved: boolean;
  approved_at: string | null;
  created_at: string;
}

export function ApprovalsPage() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [profiles, setProfiles] = useState<ApprovalProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ pending: number; approved: number }>({ pending: 0, approved: 0 });
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const approved = filter === 'approved';
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email, is_approved, approved_at, created_at')
      .eq('is_approved', approved)
      .order(approved ? 'approved_at' : 'created_at', { ascending: false });
    setProfiles((data as ApprovalProfile[]) || []);

    const [p, a] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    ]);
    setCounts({ pending: p.count || 0, approved: a.count || 0 });

    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setSavingId(id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('profiles')
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
        approved_by: user?.id ?? null,
      })
      .eq('id', id);
    setSavingId(null);
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm('¿Seguro que querés revocar la aprobación de este usuario? Perderá acceso a la app.')) return;
    setSavingId(id);
    await supabase
      .from('profiles')
      .update({ is_approved: false, approved_at: null, approved_by: null })
      .eq('id', id);
    setSavingId(null);
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Aprobación de cuentas</h1>
          <p className="text-text-secondary mt-1">
            Los usuarios que se registran quedan pendientes hasta que los aprobés manualmente.
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 w-fit">
        <FilterTab
          label="Pendientes"
          count={counts.pending}
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          color="text-warning"
        />
        <FilterTab
          label="Aprobadas"
          count={counts.approved}
          active={filter === 'approved'}
          onClick={() => setFilter('approved')}
          color="text-accent"
        />
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando...</div>
      ) : profiles.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{filter === 'pending' ? 'No hay cuentas pendientes.' : 'Sin cuentas aprobadas todavía.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <ApprovalCard
              key={p.id}
              profile={p}
              saving={savingId === p.id}
              onApprove={() => approve(p.id)}
              onRevoke={() => revoke(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({ label, count, active, onClick, color }: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? color + ' bg-card' : 'text-text-tertiary bg-background'}`}>
        {count}
      </span>
    </button>
  );
}

function ApprovalCard({ profile, saving, onApprove, onRevoke }: {
  profile: ApprovalProfile;
  saving: boolean;
  onApprove: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-base font-bold text-primary">{(profile.full_name?.[0] ?? profile.email?.[0] ?? '?').toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary truncate">
          {profile.full_name ?? 'Sin nombre'}
        </p>
        {profile.email && (
          <p className="flex items-center gap-1.5 text-xs text-text-secondary truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {profile.email}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs text-text-tertiary mt-0.5">
          <Clock className="w-3 h-3 flex-shrink-0" />
          {profile.is_approved && profile.approved_at
            ? `Aprobado ${new Date(profile.approved_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}`
            : `Registrado ${new Date(profile.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
        </p>
      </div>

      {profile.is_approved ? (
        <button
          onClick={onRevoke}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-error/30 text-error rounded-xl text-sm font-semibold hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          <UserX className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Revocar'}
        </button>
      ) : (
        <button
          onClick={onApprove}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? 'Aprobando...' : 'Aprobar'}
        </button>
      )}
    </div>
  );
}
