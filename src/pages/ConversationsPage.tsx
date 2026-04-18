import { MessageSquare, AlertTriangle, Clock } from 'lucide-react';
import { formatDateTime, EMOTIONS } from '../lib/utils';
import { useConversations, useDashboardStats } from '../hooks/useSupabaseData';

export function ConversationsPage() {
  const { conversations, loading } = useConversations();
  const stats = useDashboardStats();

  const crisisConvs = conversations.filter((c) => c.is_crisis);
  const todayConvs = conversations.filter((c) => {
    const today = new Date().toISOString().split('T')[0];
    return c.created_at.startsWith(today);
  });

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Conversaciones</h1>
        <p className="text-text-secondary mt-1">Monitoreo de conversaciones con el asistente IA</p>
      </div>

      {/* Crisis alert */}
      {crisisConvs.length > 0 && (
        <div className="bg-error/5 border border-error/20 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error mt-0.5" />
          <div>
            <h4 className="font-semibold text-error">{crisisConvs.length} conversación{crisisConvs.length > 1 ? 'es' : ''} con señales de crisis</h4>
            <p className="text-sm text-text-secondary mt-1">
              Se activó el flujo de contención automático. Revisar para asegurar respuesta adecuada.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center gap-2 text-text-tertiary mb-2">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Hoy</span>
          </div>
          <p className="text-2xl font-bold">{loading ? '...' : todayConvs.length}</p>
          <p className="text-xs text-text-tertiary">conversaciones</p>
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center gap-2 text-text-tertiary mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Promedio</span>
          </div>
          <p className="text-2xl font-bold">
            {loading || conversations.length === 0
              ? '—'
              : (conversations.reduce((a, c) => a + c.message_count, 0) / conversations.length).toFixed(1)}
          </p>
          <p className="text-xs text-text-tertiary">mensajes por conversación</p>
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center gap-2 text-error mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Crisis</span>
          </div>
          <p className="text-2xl font-bold text-error">{stats.loading ? '...' : stats.crisisCount}</p>
          <p className="text-xs text-text-tertiary">detectadas hoy</p>
        </div>
      </div>

      {/* Conversations list */}
      {loading ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando conversaciones...</div>
      ) : conversations.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Sin conversaciones aún</div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const emotion = conv.initial_emotion ? EMOTIONS[conv.initial_emotion] : null;
            return (
              <div
                key={conv.id}
                className={`bg-surface rounded-2xl p-5 shadow-sm border transition-colors cursor-pointer hover:border-primary/30 ${
                  conv.is_crisis ? 'border-error/30' : 'border-border/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                      {(conv.user_name ?? '?').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{conv.user_name ?? 'Usuario'}</p>
                        {emotion && <span className="text-lg">{emotion.emoji}</span>}
                        {conv.is_crisis && (
                          <span className="text-xs bg-error/15 text-error font-medium px-2 py-0.5 rounded-full">
                            Crisis
                          </span>
                        )}
                      </div>
                      {conv.title && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          {conv.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">{formatDateTime(conv.created_at)}</p>
                    <p className="text-xs text-text-tertiary mt-1">{conv.message_count} mensajes</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
