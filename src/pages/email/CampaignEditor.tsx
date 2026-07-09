import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ArrowLeft, Type, Heading1, MousePointerClick, Image as ImageIcon, Minus,
  MoveVertical, Trash2, Copy, Send, Save, Users, Eye, Loader2, GripVertical,
  X, Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Block, BlockType, CampaignStyle } from '../../lib/emailRender';
import { newBlock, renderEmail, THEMES, DEFAULT_STYLE, styleFrom, b2betterStarter } from '../../lib/emailRender';

interface Tag { id: string; name: string; color: string; contacts: number }
interface Audience { mode: 'all' | 'tags'; tag_ids?: string[]; match?: 'any' | 'all' }
type RightTab = 'design' | 'block' | 'settings' | 'send';

const PALETTE: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: 'heading', label: 'Título', icon: Heading1 },
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'button', label: 'Botón', icon: MousePointerClick },
  { type: 'image', label: 'Imagen', icon: ImageIcon },
  { type: 'divider', label: 'Separador', icon: Minus },
  { type: 'spacer', label: 'Espacio', icon: MoveVertical },
];

export function CampaignEditor({ campaignId, onClose }: { campaignId: string | null; onClose: () => void }) {
  const [name, setName] = useState('Campaña sin título');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [blocks, setBlocks] = useState<Block[]>(b2betterStarter());
  const [style, setStyle] = useState<CampaignStyle>(DEFAULT_STYLE);
  const [themeKey, setThemeKey] = useState('b2better');
  const [audience, setAudience] = useState<Audience>({ mode: 'all' });
  const [status, setStatus] = useState('draft');
  const [id, setId] = useState<string | null>(campaignId);

  const [tags, setTags] = useState<Tag[]>([]);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('design');
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [confirmSend, setConfirmSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  useEffect(() => { supabase.rpc('admin_tags_list').then(({ data }) => setTags((data as Tag[]) || [])); }, []);

  useEffect(() => {
    if (!campaignId) return;
    supabase.rpc('admin_campaign_get', { p_id: campaignId }).then(({ data }) => {
      if (!data) return;
      const c = data as any;
      setId(c.id); setName(c.name); setSubject(c.subject || ''); setPreheader(c.preheader || '');
      setFromName(c.from_name || ''); setFromEmail(c.from_email || '');
      setBlocks(Array.isArray(c.blocks) && c.blocks.length ? c.blocks : [newBlock('text')]);
      setAudience(c.audience || { mode: 'all' });
      setStatus(c.status || 'draft');
      if (c.style && Object.keys(c.style).length) { setStyle(styleFrom(c.style)); setThemeKey(c.style.key || 'calido'); }
    });
  }, [campaignId]);

  useEffect(() => {
    const t = setTimeout(() => {
      supabase.rpc('admin_campaign_audience_preview', { p_audience: audience })
        .then(({ data }) => setAudienceCount((data as any)?.count ?? null));
    }, 400);
    return () => clearTimeout(t);
  }, [audience]);

  const html = useMemo(() => renderEmail(blocks, { preheader, style, brand: 'B2Better' }), [blocks, preheader, style]);

  // ---- edición de bloques ----
  const update = (bid: string, patch: Partial<Block>) =>
    setBlocks((bs) => bs.map((b) => (b.id === bid ? { ...b, ...patch } as Block : b)));
  const remove = (bid: string) => { setBlocks((bs) => bs.filter((b) => b.id !== bid)); if (selected === bid) setSelected(null); };
  const duplicate = (bid: string) => setBlocks((bs) => {
    const i = bs.findIndex((b) => b.id === bid); if (i < 0) return bs;
    const copy = { ...bs[i], id: (crypto.randomUUID?.() ?? String(Math.random())).slice(0, 8) };
    const c = [...bs]; c.splice(i + 1, 0, copy); return c;
  });
  const addAt = (type: BlockType, index: number) => {
    const b = newBlock(type, style.accent);
    setBlocks((bs) => { const c = [...bs]; c.splice(index, 0, b); return c; });
    setSelected(b.id); setRightTab('block');
  };

  // ---- drag & drop ----
  const drag = useRef<{ kind: 'new' | 'reorder'; type?: BlockType; id?: string } | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const onDropAt = (index: number) => {
    const d = drag.current; drag.current = null; setOverIndex(null);
    if (!d) return;
    if (d.kind === 'new' && d.type) { addAt(d.type, index); return; }
    if (d.kind === 'reorder' && d.id) {
      setBlocks((bs) => {
        const from = bs.findIndex((b) => b.id === d.id); if (from < 0) return bs;
        const c = [...bs]; const [m] = c.splice(from, 1);
        c.splice(from < index ? index - 1 : index, 0, m); return c;
      });
    }
  };

  const chooseTheme = (key: string) => {
    const th = THEMES.find((t) => t.key === key); if (!th) return;
    setThemeKey(key); setStyle(th.style);
    // Recolorear botones que usaban el acento anterior
    setBlocks((bs) => bs.map((b) => (b.type === 'button' && b.bg === style.accent ? { ...b, bg: th.style.accent } : b)));
  };

  const save = useCallback(async (): Promise<string | null> => {
    setSaving(true);
    const { data, error } = await supabase.rpc('admin_campaign_upsert', {
      p_id: id, p_name: name, p_subject: subject, p_preheader: preheader,
      p_from_name: fromName, p_from_email: fromEmail, p_blocks: blocks, p_html: html,
      p_audience: audience, p_style: { ...style, key: themeKey },
    });
    setSaving(false);
    if (error) { flash('Error al guardar: ' + error.message); return null; }
    if (data) setId(data as string);
    return (data as string) || id;
  }, [id, name, subject, preheader, fromName, fromEmail, blocks, html, audience, style, themeKey]);

  const sendTest = async () => {
    if (!testTo) return flash('Ingresá un email de prueba');
    const cid = await save(); if (!cid) return;
    const { error } = await supabase.rpc('admin_campaign_send_test', { p_id: cid, p_to: testTo });
    flash(error ? 'Error: ' + error.message : `Correo de prueba enviado a ${testTo} ✓`);
  };
  const sendCampaign = async () => {
    const cid = await save(); if (!cid) return;
    setSending(true);
    const { data, error } = await supabase.rpc('admin_campaign_send', { p_id: cid });
    setSending(false); setConfirmSend(false);
    if (error) return flash('Error al enviar: ' + error.message);
    setStatus('sent'); flash(`Campaña enviada a ${(data as any)?.sent ?? '?'} contactos 🎉`);
  };

  const sent = status === 'sent' || status === 'sending';
  const selBlock = blocks.find((b) => b.id === selected) || null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50 bg-surface shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-card">
          <ArrowLeft className="w-4 h-4" /> Salir
        </button>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="text-lg font-bold text-text-primary bg-transparent outline-none flex-1 min-w-0" />
        {sent && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent/15 text-accent">Enviada</span>}
        <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-card">
          <Eye className="w-4 h-4" /> Previsualizar
        </button>
        <button onClick={save} disabled={saving || sent}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-card text-text-primary hover:bg-border/50 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
        </button>
        <button onClick={() => { setRightTab('send'); setConfirmSend(true); }} disabled={sent || !subject}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
          <Send className="w-4 h-4" /> Enviar
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Paleta (izquierda) */}
        <aside className="w-44 shrink-0 border-r border-border/50 bg-surface p-3 overflow-y-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary mb-2 px-1">Bloques</p>
          <p className="text-[11px] text-text-tertiary mb-3 px-1">Arrastralos al correo o hacé clic para agregar.</p>
          <div className="space-y-2">
            {PALETTE.map(({ type, label, icon: Icon }) => (
              <div key={type} draggable
                onDragStart={() => { drag.current = { kind: 'new', type }; }}
                onDragEnd={() => { drag.current = null; setOverIndex(null); }}
                onClick={() => addAt(type, blocks.length)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-card border border-border/50 text-text-secondary hover:text-text-primary hover:border-primary/40 cursor-grab active:cursor-grabbing select-none">
                <Icon className="w-4 h-4" /> {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Lienzo (centro) */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: style.bg }}
          onDragOver={(e) => { if (drag.current) { e.preventDefault(); if (overIndex === null) setOverIndex(blocks.length); } }}
          onDrop={() => overIndex !== null && onDropAt(overIndex)}>
          <div className="mx-auto" style={{ maxWidth: 600 }}>
            <div style={{ background: style.contentBg, borderRadius: style.radius, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
              {style.logoUrl
                ? <div style={{ background: style.headerBg ?? '#fff', padding: '26px 40px', textAlign: 'center' }}>
                    <img src={style.logoUrl} alt="logo" style={{ width: 140, height: 'auto', display: 'inline-block' }} />
                  </div>
                : <div style={{ height: 16 }} />}
              {blocks.length === 0 && (
                <div className="text-center py-16 px-6" style={{ color: style.muted }}>
                  <MoveVertical className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Arrastrá bloques acá para empezar</p>
                </div>
              )}
              {blocks.map((b, i) => (
                <div key={b.id}>
                  <DropLine active={overIndex === i} />
                  <BlockCanvas
                    block={b} style={style} selected={selected === b.id}
                    onSelect={() => { setSelected(b.id); setRightTab('block'); }}
                    onDelete={() => remove(b.id)} onDuplicate={() => duplicate(b.id)}
                    onDragStart={() => { drag.current = { kind: 'reorder', id: b.id }; }}
                    onDragEnd={() => { drag.current = null; setOverIndex(null); }}
                    onDragOver={(e, half) => { if (drag.current) { e.preventDefault(); setOverIndex(half === 'top' ? i : i + 1); } }}
                  />
                </div>
              ))}
              <DropLine active={overIndex === blocks.length} />
              <div style={{ height: 16 }} />
            </div>
            <div style={{ textAlign: 'center', padding: '16px', fontSize: 12, color: style.muted }}>
              Darme de baja · pie automático
            </div>
          </div>
        </main>

        {/* Panel derecho */}
        <aside className="w-[340px] shrink-0 border-l border-border/50 bg-surface flex flex-col min-h-0">
          <div className="flex border-b border-border/50 shrink-0">
            {([['design', 'Diseño'], ['block', 'Bloque'], ['settings', 'Ajustes'], ['send', 'Enviar']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setRightTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${rightTab === t ? 'text-primary border-b-2 border-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'design' && <DesignPanel themeKey={themeKey} onPick={chooseTheme} />}
            {rightTab === 'block' && (selBlock
              ? <BlockFields b={selBlock} onChange={(p) => update(selBlock.id, p)} />
              : <Hint text="Seleccioná un bloque del correo para editarlo." />)}
            {rightTab === 'settings' && (
              <SettingsPanel {...{ subject, setSubject, preheader, setPreheader, fromName, setFromName, fromEmail, setFromEmail, audience, setAudience, tags, audienceCount }} />
            )}
            {rightTab === 'send' && (
              <SendPanel {...{ testTo, setTestTo, sendTest, audienceCount, subject, onSend: () => setConfirmSend(true), sent }} />
            )}
          </div>
        </aside>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-[60]" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-[620px] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/10">
              <span className="text-sm font-semibold text-gray-700">Vista previa real</span>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <iframe title="preview" srcDoc={html} className="w-full" style={{ height: '72vh', border: 0 }} />
          </div>
        </div>
      )}

      {/* Confirmar envío */}
      {confirmSend && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]" onClick={() => setConfirmSend(false)}>
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-1">Enviar campaña</h3>
            <p className="text-sm text-text-secondary mb-4">
              Estás por enviar <b className="text-text-primary">“{subject || name}”</b> a{' '}
              <b className="text-text-primary">{audienceCount ?? '…'} contactos</b> reales. No se puede deshacer.
            </p>
            <div className="bg-warning/10 text-warning text-xs rounded-xl p-3 mb-4">¿Ya te mandaste una prueba y quedó como querías?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmSend(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">Cancelar</button>
              <button onClick={sendCampaign} disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar a {audienceCount ?? '…'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text-primary text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-[70]">{toast}</div>}
    </div>
  );
}

// ---- Lienzo: un bloque ----
function BlockCanvas({ block: b, style: s, selected, onSelect, onDelete, onDuplicate, onDragStart, onDragEnd, onDragOver }: {
  block: Block; style: CampaignStyle; selected: boolean;
  onSelect: () => void; onDelete: () => void; onDuplicate: () => void;
  onDragStart: () => void; onDragEnd: () => void; onDragOver: (e: React.DragEvent, half: 'top' | 'bottom') => void;
}) {
  return (
    <div
      onClick={onSelect}
      onDragOver={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onDragOver(e, e.clientY < r.top + r.height / 2 ? 'top' : 'bottom');
      }}
      className={`group relative cursor-pointer transition-shadow ${selected ? 'ring-2 ring-inset ring-primary' : 'hover:ring-2 hover:ring-inset hover:ring-primary/30'}`}
    >
      {/* toolbar */}
      <div className={`absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg bg-white shadow border border-black/5 px-0.5 py-0.5 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <span draggable onDragStart={(e) => { e.stopPropagation(); onDragStart(); }} onDragEnd={onDragEnd}
          onClick={(e) => e.stopPropagation()} title="Arrastrar para mover"
          className="p-1.5 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></span>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1.5 text-gray-400 hover:text-gray-700"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <BlockView b={b} s={s} />
    </div>
  );
}

// Aproximación visual del bloque (WYSIWYG) con los estilos del tema.
function BlockView({ b, s }: { b: Block; s: CampaignStyle }) {
  const pad = '8px 32px';
  if (b.type === 'heading') return <div style={{ padding: pad, textAlign: b.align, fontFamily: s.headingFont, fontSize: 26, fontWeight: 700, lineHeight: 1.25, color: s.text, whiteSpace: 'pre-wrap' }}>{b.text}</div>;
  if (b.type === 'text') return <div style={{ padding: pad, textAlign: b.align, fontFamily: s.bodyFont, fontSize: 16, lineHeight: 1.6, color: s.text, whiteSpace: 'pre-wrap' }}>{b.text}</div>;
  if (b.type === 'button') return (
    <div style={{ padding: pad, textAlign: b.align }}>
      <span style={{ display: 'inline-block', padding: '13px 28px', background: b.bg, color: b.color, borderRadius: 10, fontFamily: s.bodyFont, fontWeight: 700, fontSize: 16 }}>{b.text || 'Botón'}</span>
    </div>
  );
  if (b.type === 'image') return (
    <div style={{ padding: pad }}>
      {b.src ? <img src={b.src} alt={b.alt} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
        : <div style={{ border: `2px dashed ${s.muted}55`, borderRadius: 8, padding: '32px', textAlign: 'center', color: s.muted, fontFamily: s.bodyFont, fontSize: 13 }}>🖼️ Imagen — pegá una URL en el panel derecho</div>}
    </div>
  );
  if (b.type === 'divider') return <div style={{ padding: '12px 32px' }}><div style={{ borderTop: `1px solid ${s.muted}55` }} /></div>;
  return <div style={{ height: b.size }} />;
}

function DropLine({ active }: { active: boolean }) {
  return <div style={{ height: active ? 3 : 0 }} className={active ? 'mx-6 my-1 rounded bg-primary transition-all' : 'transition-all'} />;
}

// ---- Panel: Diseño (temas) ----
function DesignPanel({ themeKey, onPick }: { themeKey: string; onPick: (k: string) => void }) {
  return (
    <div>
      <p className="text-xs text-text-secondary mb-3">Elegí una estética. Cambia colores y tipografías de todo el correo.</p>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => {
          const on = t.key === themeKey;
          return (
            <button key={t.key} onClick={() => onPick(t.key)}
              className={`relative rounded-xl overflow-hidden border-2 text-left transition-colors ${on ? 'border-primary' : 'border-border/50 hover:border-primary/40'}`}>
              {on && <span className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
              <div style={{ background: t.style.bg, padding: 10 }}>
                <div style={{ background: t.style.contentBg, borderRadius: t.style.radius / 2, padding: 10, minHeight: 62 }}>
                  <div style={{ height: 8, width: '70%', background: t.style.text, opacity: .85, borderRadius: 3, marginBottom: 6 }} />
                  <div style={{ height: 5, width: '100%', background: t.style.muted, opacity: .5, borderRadius: 3, marginBottom: 3 }} />
                  <div style={{ height: 5, width: '85%', background: t.style.muted, opacity: .5, borderRadius: 3, marginBottom: 8 }} />
                  <div style={{ display: 'inline-block', height: 14, width: 46, background: t.style.accent, borderRadius: 5 }} />
                </div>
              </div>
              <div className="px-2.5 py-1.5 text-xs font-semibold text-text-primary bg-surface">{t.emoji} {t.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Panel: Ajustes ----
function SettingsPanel({ subject, setSubject, preheader, setPreheader, fromName, setFromName, fromEmail, setFromEmail, audience, setAudience, tags, audienceCount }: any) {
  return (
    <div className="space-y-4">
      <Field label="Asunto"><input value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="Asunto del email" className={inp} /></Field>
      <Field label="Preheader (vista previa en bandeja)"><input value={preheader} onChange={(e: any) => setPreheader(e.target.value)} className={inp} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Remitente"><input value={fromName} onChange={(e: any) => setFromName(e.target.value)} placeholder="B2Better" className={inp} /></Field>
        <Field label="Email (opcional)"><input value={fromEmail} onChange={(e: any) => setFromEmail(e.target.value)} placeholder="sistema" className={inp} /></Field>
      </div>
      <div className="pt-2 border-t border-border/50">
        <p className="text-xs font-semibold text-text-primary mb-2">Destinatarios</p>
        <div className="flex gap-2 mb-2">
          <TabBtn active={audience.mode === 'all'} onClick={() => setAudience({ mode: 'all' })}>Todos</TabBtn>
          <TabBtn active={audience.mode === 'tags'} onClick={() => setAudience({ mode: 'tags', tag_ids: audience.tag_ids || [], match: audience.match || 'any' })}>Por etiquetas</TabBtn>
        </div>
        {audience.mode === 'tags' && (
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && <span className="text-xs text-text-tertiary">Sin etiquetas creadas.</span>}
            {tags.map((t: Tag) => {
              const on = audience.tag_ids?.includes(t.id);
              return <button key={t.id} onClick={() => setAudience((a: Audience) => ({ ...a, tag_ids: on ? (a.tag_ids || []).filter((x) => x !== t.id) : [...(a.tag_ids || []), t.id] }))}
                className="text-xs font-medium px-2 py-0.5 rounded-full border" style={on ? { background: t.color, color: '#fff', borderColor: t.color } : { borderColor: t.color, color: t.color }}>{t.name} · {t.contacts}</button>;
            })}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary"><Users className="w-4 h-4 text-primary" /><b className="text-text-primary">{audienceCount ?? '…'}</b> recibirán la campaña</div>
      </div>
    </div>
  );
}

// ---- Panel: Enviar ----
function SendPanel({ testTo, setTestTo, sendTest, audienceCount, subject, onSend, sent }: any) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-text-primary mb-2">Enviar prueba</p>
        <div className="flex gap-2">
          <input value={testTo} onChange={(e: any) => setTestTo(e.target.value)} placeholder="tu@email.com" className={inp} />
          <button onClick={sendTest} className="shrink-0 px-3 py-2 rounded-xl text-sm font-semibold bg-card border border-border/50 text-text-primary hover:bg-border/40"><Send className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-text-tertiary mt-1">Probá cómo llega antes de enviar a todos.</p>
      </div>
      <div className="pt-4 border-t border-border/50">
        <div className="bg-primary/5 rounded-xl p-3 mb-3 text-sm text-text-secondary flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> <b className="text-text-primary">{audienceCount ?? '…'}</b> contactos</div>
        <button onClick={onSend} disabled={sent || !subject}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
          <Send className="w-4 h-4" /> Enviar campaña
        </button>
        {!subject && <p className="text-xs text-warning mt-2">Poné un asunto en Ajustes antes de enviar.</p>}
      </div>
    </div>
  );
}

// ---- Editor de propiedades del bloque ----
const inp = 'w-full bg-card rounded-xl px-3 py-2 text-sm text-text-primary border border-border/50 outline-none focus:border-primary/50';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs text-text-secondary mb-1">{label}</span>{children}</label>;
}
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${active ? 'bg-primary text-white' : 'bg-card text-text-secondary hover:text-text-primary'}`}>{children}</button>;
}
function Hint({ text }: { text: string }) {
  return <div className="text-center text-text-tertiary text-sm py-10 px-4">{text}</div>;
}

const alignBtns: { v: Align; l: string }[] = [{ v: 'left', l: '◧' }, { v: 'center', l: '▣' }, { v: 'right', l: '◨' }];
type Align = 'left' | 'center' | 'right';

function BlockFields({ b, onChange }: { b: Block; onChange: (p: any) => void }) {
  const ta = 'w-full bg-card rounded-lg px-2.5 py-2 text-sm text-text-primary border border-border/50 outline-none focus:border-primary/50';
  const label = { heading: 'Título', text: 'Texto', button: 'Botón', image: 'Imagen', divider: 'Separador', spacer: 'Espacio' }[b.type];
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
      {(b.type === 'heading' || b.type === 'text') && (
        <>
          <textarea value={b.text} onChange={(e) => onChange({ text: e.target.value })} rows={b.type === 'text' ? 5 : 2} className={ta} />
          <AlignPicker value={b.align} onChange={(align) => onChange({ align })} />
        </>
      )}
      {b.type === 'button' && (
        <>
          <input value={b.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Texto del botón" className={ta} />
          <input value={b.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://…" className={ta} />
          <AlignPicker value={b.align} onChange={(align) => onChange({ align })} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">Fondo <input type="color" value={b.bg} onChange={(e) => onChange({ bg: e.target.value })} className="w-7 h-7 rounded border-0 bg-transparent" /></label>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">Texto <input type="color" value={b.color} onChange={(e) => onChange({ color: e.target.value })} className="w-7 h-7 rounded border-0 bg-transparent" /></label>
          </div>
        </>
      )}
      {b.type === 'image' && (
        <>
          <ImageField src={b.src} onSrc={(src) => onChange({ src })} />
          <input value={b.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="Link al hacer clic (opcional)" className={ta} />
          <input value={b.alt} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Texto alternativo" className={ta} />
        </>
      )}
      {b.type === 'spacer' && (
        <label className="flex items-center gap-2 text-xs text-text-secondary">Altura <input type="range" min={8} max={80} value={b.size} onChange={(e) => onChange({ size: Number(e.target.value) })} className="flex-1" /> {b.size}px</label>
      )}
      {b.type === 'divider' && <p className="text-xs text-text-tertiary">Línea separadora horizontal.</p>}
    </div>
  );
}

function ImageField({ src, onSrc }: { src: string; onSrc: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setErr(null); setUploading(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `campaigns/${Math.random().toString(36).slice(2)}-${safe}`;
    const { error } = await supabase.storage.from('email-assets').upload(path, file, { contentType: file.type, upsert: false });
    if (error) { setErr(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('email-assets').getPublicUrl(path);
    onSrc(data.publicUrl); setUploading(false);
  };

  return (
    <div className="space-y-2">
      {src
        ? <div className="relative group">
            <img src={src} alt="" className="w-full rounded-lg border border-border/50" />
            <button onClick={() => onSrc('')} className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
          </div>
        : <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
            {uploading
              ? <span className="text-sm text-text-secondary flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Subiendo…</span>
              : <span className="text-sm text-text-secondary flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" /> Subir imagen</span>}
          </div>}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
      <input value={src} onChange={(e) => onSrc(e.target.value)} placeholder="o pegá una URL (https://…)"
        className="w-full bg-card rounded-lg px-2.5 py-2 text-sm text-text-primary border border-border/50 outline-none focus:border-primary/50" />
      {err && <p className="text-xs text-error">{err}</p>}
    </div>
  );
}

function AlignPicker({ value, onChange }: { value: string; onChange: (v: Align) => void }) {
  return (
    <div className="flex gap-1">
      {alignBtns.map((a) => (
        <button key={a.v} onClick={() => onChange(a.v)} className={`w-7 h-7 rounded-lg text-sm ${value === a.v ? 'bg-primary text-white' : 'bg-card text-text-tertiary hover:text-text-primary'}`}>{a.l}</button>
      ))}
    </div>
  );
}
