import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Tag as TagIcon, Users, Send, Trash2, Pencil, Loader2, X,
  MousePointerClick, Eye, CheckCircle2, Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CampaignEditor } from './email/CampaignEditor';

type Tab = 'campaigns' | 'contacts' | 'tags';

export function EmailMarketingPage() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [editing, setEditing] = useState<string | null | false>(false); // false = lista, null = nueva, string = editar

  if (editing !== false) {
    return <CampaignEditor campaignId={editing} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2"><Mail className="w-6 h-6 text-primary" /> Email Marketing</h1>
          <p className="text-text-secondary mt-1 text-sm">Campañas, contactos y etiquetas. Envíos por Resend.</p>
        </div>
        {tab === 'campaigns' && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Nueva campaña
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-card rounded-xl p-1 w-fit">
        {([['campaigns', 'Campañas', Send], ['contacts', 'Contactos', Users], ['tags', 'Etiquetas', TagIcon]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && <CampaignsTab onEdit={(id) => setEditing(id)} />}
      {tab === 'contacts' && <ContactsTab />}
      {tab === 'tags' && <TagsTab />}
    </div>
  );
}

// ============ CAMPAÑAS ============
interface Campaign {
  id: string; name: string; subject: string; status: string;
  total_recipients: number; sent_count: number; opened_count: number; clicked_count: number;
  sent_at: string | null; updated_at: string;
}
const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'bg-text-tertiary/15 text-text-tertiary' },
  scheduled: { label: 'Programada', cls: 'bg-secondary/15 text-secondary' },
  sending: { label: 'Enviando…', cls: 'bg-warning/15 text-warning' },
  sent: { label: 'Enviada', cls: 'bg-accent/15 text-accent' },
  failed: { label: 'Falló', cls: 'bg-error/15 text-error' },
};

function CampaignsTab({ onEdit }: { onEdit: (id: string | null) => void }) {
  const [list, setList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_campaigns_list');
    setList((data as Campaign[]) || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña? No se puede deshacer.')) return;
    await supabase.rpc('admin_campaign_delete', { p_id: id }); load();
  };

  if (loading) return <Loading />;
  if (!list.length) return <Empty icon={Send} text="Todavía no hay campañas. Creá la primera." />;

  return (
    <div className="space-y-3">
      {list.map((c) => {
        const sm = STATUS_META[c.status] || STATUS_META.draft;
        const openRate = c.sent_count ? Math.round((c.opened_count / c.sent_count) * 100) : 0;
        return (
          <div key={c.id} className="bg-surface rounded-2xl p-5 border border-border/50 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-text-primary truncate">{c.name}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sm.cls}`}>{sm.label}</span>
              </div>
              <p className="text-xs text-text-secondary truncate">{c.subject || <i>sin asunto</i>}</p>
            </div>
            {c.status === 'sent' && (
              <div className="hidden sm:flex items-center gap-5 text-center">
                <Metric icon={Users} value={c.total_recipients} label="enviados" />
                <Metric icon={Eye} value={`${openRate}%`} label="apertura" />
                <Metric icon={MousePointerClick} value={c.clicked_count} label="clics" />
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(c.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-card text-text-primary hover:bg-border/40">
                {c.status === 'sent' ? <><Eye className="w-4 h-4" /> Ver</> : <><Pencil className="w-4 h-4" /> Editar</>}
              </button>
              <button onClick={() => del(c.id)} className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-card"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function Metric({ icon: Icon, value, label }: { icon: any; value: any; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 justify-center text-text-primary font-bold text-sm"><Icon className="w-3.5 h-3.5 text-primary" />{value}</div>
      <div className="text-[10px] text-text-tertiary uppercase tracking-wide">{label}</div>
    </div>
  );
}

// ============ CONTACTOS ============
interface Contact { id: string; email: string; full_name: string | null; unsubscribed: boolean; tag_ids: string[] }
interface Tag { id: string; name: string; color: string; contacts: number }

function ContactsTab() {
  const [rows, setRows] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [editContact, setEditContact] = useState<Contact | null>(null);

  const loadTags = useCallback(() => supabase.rpc('admin_tags_list').then(({ data }) => setTags((data as Tag[]) || [])), []);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_contacts', { p_search: search || null, p_limit: 100, p_offset: 0 });
    setRows(((data as any)?.rows as Contact[]) || []); setTotal((data as any)?.total || 0); setLoading(false);
  }, [search]);
  useEffect(() => { loadTags(); }, [loadTags]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const tagMap = Object.fromEntries(tags.map((t) => [t.id, t]));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulkTag = async (tagId: string, attach: boolean) => {
    await supabase.rpc('admin_tag_assign', { p_tag_id: tagId, p_user_ids: [...sel], p_attach: attach });
    setSel(new Set()); loadTags(); load();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email…"
            className="w-full bg-card rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary border border-border/50 outline-none focus:border-primary/50" />
        </div>
        <span className="text-sm text-text-secondary">{total} contactos</span>
      </div>

      {sel.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-text-primary">{sel.size} seleccionados · etiquetar:</span>
          {tags.map((t) => (
            <button key={t.id} onClick={() => bulkTag(t.id, true)} className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ background: t.color }}>+ {t.name}</button>
          ))}
          {tags.length === 0 && <span className="text-xs text-text-tertiary">Creá etiquetas primero.</span>}
          <button onClick={() => setSel(new Set())} className="ml-auto text-xs text-text-tertiary hover:text-text-primary">Limpiar</button>
        </div>
      )}

      {loading ? <Loading /> : rows.length === 0 ? <Empty icon={Users} text="No hay contactos con ese filtro." /> : (
        <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-card/50">
              <input type="checkbox" checked={sel.has(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4 accent-primary" />
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {(c.full_name?.[0] ?? c.email[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{c.full_name || 'Sin nombre'} {c.unsubscribed && <span className="text-[10px] text-error font-semibold ml-1">· dado de baja</span>}</p>
                <p className="text-xs text-text-secondary truncate">{c.email}</p>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-end max-w-[40%]">
                {c.tag_ids.map((tid) => tagMap[tid] && (
                  <span key={tid} className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white" style={{ background: tagMap[tid].color }}>{tagMap[tid].name}</span>
                ))}
              </div>
              <button onClick={() => setEditContact(c)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-card shrink-0"><TagIcon className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {editContact && (
        <ContactTagsModal contact={editContact} tags={tags} onClose={() => setEditContact(null)}
          onSaved={() => { setEditContact(null); loadTags(); load(); }} />
      )}
    </div>
  );
}

function ContactTagsModal({ contact, tags, onClose, onSaved }: { contact: Contact; tags: Tag[]; onClose: () => void; onSaved: () => void }) {
  const [ids, setIds] = useState<Set<string>>(new Set(contact.tag_ids));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await supabase.rpc('admin_contact_tags_set', { p_user_id: contact.id, p_tag_ids: [...ids] });
    setSaving(false); onSaved();
  };
  return (
    <Modal onClose={onClose} title={`Etiquetas de ${contact.full_name || contact.email}`}>
      <div className="flex flex-wrap gap-2 mb-5">
        {tags.length === 0 && <p className="text-sm text-text-tertiary">No hay etiquetas. Creá algunas en la pestaña Etiquetas.</p>}
        {tags.map((t) => {
          const on = ids.has(t.id);
          return (
            <button key={t.id} onClick={() => setIds((s) => { const n = new Set(s); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n; })}
              className="text-sm font-medium px-3 py-1.5 rounded-full border transition-colors"
              style={on ? { background: t.color, color: '#fff', borderColor: t.color } : { borderColor: t.color, color: t.color }}>
              {on && '✓ '}{t.name}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancelar</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Guardar
        </button>
      </div>
    </Modal>
  );
}

// ============ ETIQUETAS ============
function TagsTab() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ id: string | null; name: string; color: string; description: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_tags_list');
    setTags((data as Tag[]) || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft?.name.trim()) return;
    await supabase.rpc('admin_tag_upsert', { p_id: draft.id, p_name: draft.name, p_color: draft.color, p_description: draft.description });
    setDraft(null); load();
  };
  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta etiqueta? Se quita de todos los contactos.')) return;
    await supabase.rpc('admin_tag_delete', { p_id: id }); load();
  };

  return (
    <div>
      <button onClick={() => setDraft({ id: null, name: '', color: '#3D5A80', description: '' })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-card text-text-primary hover:bg-border/40 mb-4">
        <Plus className="w-4 h-4" /> Nueva etiqueta
      </button>

      {loading ? <Loading /> : !tags.length ? <Empty icon={TagIcon} text="Todavía no hay etiquetas." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tags.map((t) => (
            <div key={t.id} className="bg-surface rounded-2xl p-4 border border-border/50 flex items-center gap-3">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: t.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{t.name}</p>
                <p className="text-xs text-text-tertiary">{t.contacts} contactos</p>
              </div>
              <button onClick={() => setDraft({ id: t.id, name: t.name, color: t.color, description: '' })} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-card"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(t.id)} className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-card"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <Modal onClose={() => setDraft(null)} title={draft.id ? 'Editar etiqueta' : 'Nueva etiqueta'}>
          <label className="block mb-3"><span className="block text-xs text-text-secondary mb-1">Nombre</span>
            <input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ej: Clientes premium"
              className="w-full bg-card rounded-xl px-3 py-2 text-sm text-text-primary border border-border/50 outline-none focus:border-primary/50" /></label>
          <label className="flex items-center gap-2 mb-5 text-sm text-text-secondary">Color
            <input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="w-8 h-8 rounded border-0 bg-transparent" /></label>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDraft(null)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancelar</button>
            <button onClick={save} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90">Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ UI compartida ============
function Loading() { return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>; }
function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary"><Icon className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>{text}</p></div>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
