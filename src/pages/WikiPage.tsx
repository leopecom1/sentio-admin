import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, X, Loader2, Save,
  CheckCircle2, AlertCircle, Lightbulb, Link2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  kind: 'tema' | 'fuente';
  is_active: boolean;
  priority: number;
  updated_at?: string;
}

type Draft = Omit<KnowledgeEntry, 'id' | 'updated_at'> & { id?: string };

const EMPTY: Draft = {
  title: '',
  content: '',
  category: 'General',
  kind: 'tema',
  is_active: true,
  priority: 0,
};

export function WikiPage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_knowledge')
      .select('*')
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false });
    if (error) setStatus({ type: 'error', msg: error.message });
    else setEntries((data as KnowledgeEntry[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.content.trim()) {
      setStatus({ type: 'error', msg: 'Título y contenido son obligatorios.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    const payload = {
      title: draft.title.trim(),
      content: draft.content.trim(),
      category: (draft.category || 'General').trim(),
      kind: draft.kind,
      is_active: draft.is_active,
      priority: Number(draft.priority) || 0,
      updated_at: new Date().toISOString(),
    };
    const { error } = draft.id
      ? await supabase.from('ai_knowledge').update(payload).eq('id', draft.id)
      : await supabase.from('ai_knowledge').insert(payload);
    setSaving(false);
    if (error) {
      setStatus({ type: 'error', msg: error.message });
    } else {
      setStatus({ type: 'ok', msg: 'Guardado. El asistente lo usa en los próximos chats.' });
      setDraft(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta entrada de la base de conocimiento?')) return;
    const { error } = await supabase.from('ai_knowledge').delete().eq('id', id);
    if (error) setStatus({ type: 'error', msg: error.message });
    else { setStatus({ type: 'ok', msg: 'Entrada eliminada.' }); load(); }
  };

  const toggleActive = async (e: KnowledgeEntry) => {
    const { error } = await supabase
      .from('ai_knowledge')
      .update({ is_active: !e.is_active, updated_at: new Date().toISOString() })
      .eq('id', e.id);
    if (error) setStatus({ type: 'error', msg: error.message });
    else load();
  };

  const field =
    'mt-2 w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary';

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Base de conocimiento</h1>
          <p className="text-text-secondary mt-1">
            Temas y fuentes que el asistente IA usa para responder mejor.
          </p>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft({ ...EMPTY })}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva entrada
          </button>
        )}
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 text-sm mb-5 px-4 py-3 rounded-xl border ${
            status.type === 'ok'
              ? 'text-accent border-accent/30 bg-accent/5'
              : 'text-error border-error/30 bg-error/5'
          }`}
        >
          {status.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.msg}
        </div>
      )}

      {/* Editor */}
      {draft && (
        <section className="bg-surface rounded-2xl p-6 border border-border/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{draft.id ? 'Editar entrada' : 'Nueva entrada'}</h3>
            <button onClick={() => setDraft(null)} className="text-text-tertiary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Título</label>
                <input
                  className={field}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Ej. Respiración 4-7-8"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className={field}
                  value={draft.kind}
                  onChange={(e) => setDraft({ ...draft, kind: e.target.value as 'tema' | 'fuente' })}
                >
                  <option value="tema">Tema</option>
                  <option value="fuente">Fuente</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Contenido</label>
              <textarea
                className={`${field} resize-y leading-relaxed`}
                rows={6}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="Lo que el asistente debe saber sobre este tema..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <input
                  className={field}
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="Mentalidad, Finanzas..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prioridad</label>
                <input
                  type="number"
                  className={field}
                  value={draft.priority}
                  onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                  Activa
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
            <button
              onClick={() => setDraft(null)}
              className="px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-tertiary">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Todavía no hay entradas. Agregá temas y fuentes para que el asistente responda mejor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className={`bg-surface rounded-2xl p-5 border border-border/50 ${!e.is_active ? 'opacity-55' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {e.kind === 'fuente' ? <Link2 className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                      {e.kind}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary bg-card px-2 py-0.5 rounded-full">
                      {e.category}
                    </span>
                    <span className="text-[10px] text-text-tertiary">prioridad {e.priority}</span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary truncate">{e.title}</h3>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-3 leading-relaxed">{e.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(e)}
                    title={e.is_active ? 'Desactivar' : 'Activar'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      e.is_active ? 'text-accent bg-accent/10' : 'text-text-tertiary bg-card'
                    }`}
                  >
                    {e.is_active ? 'Activa' : 'Inactiva'}
                  </button>
                  <button
                    onClick={() => setDraft({ ...e })}
                    className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-card"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-error hover:bg-card"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
