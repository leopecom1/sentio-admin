import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, ExternalLink, Clock, ShieldAlert, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Status = 'pending' | 'approved' | 'rejected';

interface ValidationProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  validation_status: Status;
  validation_url: string | null;
  validation_answer: string | null;
  validation_submitted_at: string | null;
  validation_reviewed_at: string | null;
  validation_rejection_reason: string | null;
}

export function ValidationsPage() {
  const [filter, setFilter] = useState<Status>('pending');
  const [profiles, setProfiles] = useState<ValidationProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<Status, number>>({ pending: 0, approved: 0, rejected: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, validation_status, validation_url, validation_answer, validation_submitted_at, validation_reviewed_at, validation_rejection_reason')
      .eq('validation_status', filter)
      .not('validation_submitted_at', 'is', null)
      .order('validation_submitted_at', { ascending: false });
    setProfiles((data as ValidationProfile[]) || []);

    // Get counts
    const [pending, approved, rejected] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('validation_status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('validation_status', 'approved'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('validation_status', 'rejected'),
    ]);
    setCounts({
      pending: pending.count || 0,
      approved: approved.count || 0,
      rejected: rejected.count || 0,
    });

    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    await supabase
      .from('profiles')
      .update({
        validation_status: 'approved',
        validation_reviewed_at: new Date().toISOString(),
        validation_rejection_reason: null,
      })
      .eq('id', id);
    load();
  };

  const reject = async (id: string, reason?: string) => {
    await supabase
      .from('profiles')
      .update({
        validation_status: 'rejected',
        validation_reviewed_at: new Date().toISOString(),
        validation_rejection_reason: reason || null,
      })
      .eq('id', id);
    load();
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Validaciones de comunidad</h1>
          <p className="text-text-secondary mt-1">
            Revisá y aprobá o rechazá solicitudes de acceso a la comunidad
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 w-fit">
        <FilterTab label="Pendientes" count={counts.pending} active={filter === 'pending'} onClick={() => setFilter('pending')} color="text-warning" />
        <FilterTab label="Aprobadas" count={counts.approved} active={filter === 'approved'} onClick={() => setFilter('approved')} color="text-accent" />
        <FilterTab label="Rechazadas" count={counts.rejected} active={filter === 'rejected'} onClick={() => setFilter('rejected')} color="text-error" />
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando...</div>
      ) : profiles.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay {filter === 'pending' ? 'solicitudes pendientes' : filter === 'approved' ? 'perfiles aprobados' : 'perfiles rechazados'}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((p) => (
            <ValidationCard
              key={p.id}
              profile={p}
              onApprove={() => approve(p.id)}
              onReject={(reason) => reject(p.id, reason)}
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

function ValidationCard({
  profile,
  onApprove,
  onReject,
}: {
  profile: ValidationProfile;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const isPending = profile.validation_status === 'pending';

  return (
    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">{(profile.full_name?.[0] ?? '?').toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">{profile.full_name ?? 'Sin nombre'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {profile.validation_submitted_at && (
              <span className="flex items-center gap-1 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                {new Date(profile.validation_submitted_at).toLocaleString('es-AR', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
        <StatusPill status={profile.validation_status} />
      </div>

      {/* Content */}
      {profile.validation_url && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">URL</p>
          <a
            href={profile.validation_url.startsWith('http') ? profile.validation_url : `https://${profile.validation_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium break-all"
          >
            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {profile.validation_url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      )}

      {profile.validation_answer && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Respuesta</p>
          <div className="bg-card rounded-xl p-3 border border-border/50">
            <p className="text-sm text-text-primary italic leading-relaxed">{profile.validation_answer}</p>
          </div>
        </div>
      )}

      {profile.validation_rejection_reason && (
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Motivo de rechazo</p>
          <div className="bg-error/5 rounded-xl p-3 border border-error/15">
            <p className="text-sm text-text-primary">{profile.validation_rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="mt-4 pt-4 border-t border-border/50">
          {showReject ? (
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-y"
                placeholder="Motivo del rechazo (opcional — se muestra al usuario)"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowReject(false); setReason(''); }}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { onReject(reason); setShowReject(false); setReason(''); }}
                  className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-xl text-sm font-semibold hover:bg-error/90 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowReject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-error/30 text-error rounded-xl text-sm font-semibold hover:bg-error/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
              <button
                onClick={onApprove}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aprobar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const config = {
    pending: { label: 'Pendiente', className: 'bg-warning/15 text-warning' },
    approved: { label: 'Aprobado', className: 'bg-accent/15 text-accent' },
    rejected: { label: 'Rechazado', className: 'bg-error/15 text-error' },
  }[status];

  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
