import { useState } from 'react';
import { ClipboardList, Sparkles, ChevronDown, ChevronUp, AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  useUserOnboardings,
  useTestResults,
  type UserOnboarding,
  type TestResult,
} from '../hooks/useUserAssessments';

type Tab = 'onboarding' | 'tests';

export function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('onboarding');

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Evaluaciones</h1>
          <p className="text-text-secondary mt-1">
            Onboarding inicial y resultados de tests por usuario
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 w-fit">
        <TabButton
          icon={<Sparkles className="w-4 h-4" />}
          label="Onboarding"
          active={activeTab === 'onboarding'}
          onClick={() => setActiveTab('onboarding')}
        />
        <TabButton
          icon={<ClipboardList className="w-4 h-4" />}
          label="Tests"
          active={activeTab === 'tests'}
          onClick={() => setActiveTab('tests')}
        />
      </div>

      {activeTab === 'onboarding' && <OnboardingTab />}
      {activeTab === 'tests' && <TestsTab />}
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ══════════════════════════════════════
// Onboarding Tab
// ══════════════════════════════════════

const PRESSURE_LABELS: Record<string, string> = {
  ventas: 'Ventas',
  finanzas: 'Finanzas',
  equipo: 'Equipo',
  decisiones: 'Decisiones',
  soledad: 'Soledad',
  futuro: 'Incertidumbre',
  tiempo: 'Falta de tiempo',
  rendimiento: 'Rendimiento',
};

const GOAL_LABELS: Record<string, string> = {
  reducir_estres: 'Reducir estrés',
  mejorar_animo: 'Mejorar ánimo',
  dormir_mejor: 'Dormir mejor',
  enfocarme: 'Enfocarme mejor',
  desconectar: 'Desconectar',
  resiliencia: 'Construir resiliencia',
  habitos: 'Crear hábitos',
};

const EMOTION_LABELS: Record<string, string> = {
  calm: 'Tranquilo',
  focused: 'Enfocado',
  motivated: 'Motivado',
  grateful: 'Agradecido',
  hopeful: 'Esperanzado',
  tired: 'Cansado',
  overwhelmed: 'Abrumado',
  anxious: 'Ansioso',
  frustrated: 'Frustrado',
  sad: 'Triste',
  insecure: 'Inseguro',
  lonely: 'Solo',
  pressured: 'Presionado',
  angry: 'Enojado',
  blocked: 'Bloqueado',
};

function OnboardingTab() {
  const { users, loading } = useUserOnboardings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (users.length === 0) return <Empty text="Aún no hay onboardings completados" />;

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <OnboardingCard
          key={user.id}
          user={user}
          expanded={expandedId === user.id}
          onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
        />
      ))}
    </div>
  );
}

function OnboardingCard({ user, expanded, onToggle }: { user: UserOnboarding; expanded: boolean; onToggle: () => void }) {
  const energy = user.initial_energy ?? 0;
  const energyColor = energy >= 4 ? 'text-accent' : energy >= 3 ? 'text-warning' : 'text-error';

  return (
    <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden">
      <button onClick={onToggle} className="w-full p-5 flex items-center gap-4 hover:bg-card/30 transition-colors text-left">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {(user.full_name?.[0] ?? '?').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{user.full_name ?? 'Sin nombre'}</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            {new Date(user.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-xs font-bold ${energyColor}`}>Energía {energy}/5</p>
            <p className="text-xs text-text-tertiary">{user.pressure_types?.length ?? 0} presiones · {user.goals?.length ?? 0} metas</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-card/30">
          <Section label="Emoción inicial">
            <Pill color="primary">{EMOTION_LABELS[user.current_mood ?? ''] ?? user.current_mood ?? '—'}</Pill>
          </Section>
          <Section label="Tipos de presión">
            <div className="flex flex-wrap gap-2">
              {(user.pressure_types ?? []).length === 0 ? (
                <span className="text-xs text-text-tertiary">—</span>
              ) : (
                (user.pressure_types ?? []).map((p) => (
                  <Pill key={p} color="warning">{PRESSURE_LABELS[p] ?? p}</Pill>
                ))
              )}
            </div>
          </Section>
          <Section label="Objetivos">
            <div className="flex flex-wrap gap-2">
              {(user.goals ?? []).length === 0 ? (
                <span className="text-xs text-text-tertiary">—</span>
              ) : (
                (user.goals ?? []).map((g) => (
                  <Pill key={g} color="accent">{GOAL_LABELS[g] ?? g}</Pill>
                ))
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// Tests Tab
// ══════════════════════════════════════

function TestsTab() {
  const { results, loading } = useTestResults();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (results.length === 0) return <Empty text="Aún no hay tests completados" />;

  return (
    <div className="space-y-3">
      {results.map((r) => (
        <TestResultCard
          key={r.id}
          result={r}
          expanded={expandedId === r.id}
          onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
        />
      ))}
    </div>
  );
}

function severityVisual(severity: string) {
  switch (severity) {
    case 'none':
      return { label: 'Sin signos', color: 'bg-accent/15 text-accent', icon: <CheckCircle2 className="w-4 h-4" /> };
    case 'low':
      return { label: 'Riesgo bajo', color: 'bg-yellow-500/15 text-yellow-500', icon: <Info className="w-4 h-4" /> };
    case 'moderate':
      return { label: 'Riesgo moderado', color: 'bg-warning/15 text-warning', icon: <AlertCircle className="w-4 h-4" /> };
    case 'high':
      return { label: 'Riesgo alto', color: 'bg-error/15 text-error', icon: <AlertTriangle className="w-4 h-4" /> };
    default:
      return { label: severity, color: 'bg-card text-text-secondary', icon: <Info className="w-4 h-4" /> };
  }
}

function TestResultCard({ result, expanded, onToggle }: { result: TestResult; expanded: boolean; onToggle: () => void }) {
  const sev = severityVisual(result.severity);

  return (
    <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden">
      <button onClick={onToggle} className="w-full p-5 flex items-center gap-4 hover:bg-card/30 transition-colors text-left">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {result.user_name} ·{' '}
            <span className="text-text-secondary font-normal">{result.test_type}</span>
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">
            {new Date(result.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${sev.color}`}>
          {sev.icon}
          {sev.label}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-card/30">
          {/* Scores */}
          <Section label="Puntajes por dimensión">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(result.scores).map(([key, val]) => (
                <div key={key} className="bg-surface rounded-xl p-3 border border-border/50">
                  <p className="text-xs text-text-tertiary capitalize">{dimensionLabel(key)}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{val}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Answers */}
          <Section label={`Respuestas (${result.answers.length})`}>
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {result.answers.map((a, i) => (
                <div key={i} className="bg-surface rounded-lg p-3 border border-border/50">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-text-tertiary font-bold mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary">{a.question}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">{dimensionLabel(a.dimension)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                          {answerLabel(a.answer_value)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function dimensionLabel(dim: string): string {
  switch (dim) {
    case 'exhaustion': return 'Agotamiento';
    case 'cynicism': return 'Cinismo';
    case 'efficacy': return 'Realización';
    default: return dim;
  }
}

function answerLabel(value: number | null): string {
  const labels = ['Nunca', 'Pocas/año', '1×/mes', 'Varias/mes', '1×/sem', 'Varias/sem', 'Diario'];
  if (value == null) return '—';
  return labels[value] ?? `${value}`;
}

// ══════════════════════════════════════
// Shared
// ══════════════════════════════════════

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">{label}</p>
      {children}
    </div>
  );
}

function Pill({ color, children }: { color: 'primary' | 'accent' | 'warning'; children: React.ReactNode }) {
  const colorMap = {
    primary: 'bg-primary/15 text-primary',
    accent: 'bg-accent/15 text-accent',
    warning: 'bg-warning/15 text-warning',
  };
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${colorMap[color]}`}>
      {children}
    </span>
  );
}

function Loading() {
  return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando...</div>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">
      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p>{text}</p>
    </div>
  );
}
