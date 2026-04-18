import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Check, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  title: string;
  description: string;
}

interface AboutContent {
  name: string;
  subtitle: string;
  creator_label: string;
  quote: string;
  who_is_title: string;
  who_is_paragraphs: string[];
  mission_title: string;
  mission_intro: string;
  mission_items: Item[];
  method_title: string;
  method_intro: string;
  method_steps: Item[];
  why_title: string;
  why_paragraphs: string[];
  cta_label: string;
  cta_url: string;
  footer: string;
}

const DEFAULT: AboutContent = {
  name: 'Mateo Silvera',
  subtitle: 'Psicólogo clínico · Emprendedor',
  creator_label: 'Creador de',
  quote: '',
  who_is_title: 'Quién es',
  who_is_paragraphs: [''],
  mission_title: 'La misión de B2Better',
  mission_intro: '',
  mission_items: [{ title: '', description: '' }],
  method_title: 'El método: Sistema KOYNOS',
  method_intro: '',
  method_steps: [{ title: '', description: '' }],
  why_title: 'Por qué existe esta app',
  why_paragraphs: [''],
  cta_label: 'Visitar mateosilvera.com',
  cta_url: 'https://mateosilvera.com',
  footer: '© 2026 B2Better · Mateo Silvera',
};

export function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    const { data } = await supabase.from('about_content').select('*').maybeSingle();
    if (data) {
      setRowId(data.id);
      setContent({ ...DEFAULT, ...(data.content as AboutContent) });
    }
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const payload = {
      singleton: true,
      content,
      updated_at: new Date().toISOString(),
    };
    const { error } = rowId
      ? await supabase.from('about_content').update(payload).eq('id', rowId)
      : await supabase.from('about_content').insert(payload);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await loadContent();
    }
  }

  function set<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setContent({ ...content, [key]: value });
  }

  if (loading) return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sobre B2Better</h1>
          <p className="text-text-secondary mt-1">
            Editá los textos que ve el usuario en la pantalla "Sobre B2Better"
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl p-3 mb-6 text-sm text-text-secondary">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p>Los iconos y el diseño están fijos. Acá solo editás los textos. La foto y el logo se cambian desde el código.</p>
      </div>

      <div className="space-y-5">
        <Card title="Hero">
          <Field label="Nombre">
            <input
              value={content.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Subtítulo (badge)">
            <input
              value={content.subtitle}
              onChange={(e) => set('subtitle', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Etiqueta sobre el logo">
            <input
              value={content.creator_label}
              onChange={(e) => set('creator_label', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
        </Card>

        <Card title="Cita destacada">
          <Field label="Quote">
            <textarea
              value={content.quote}
              onChange={(e) => set('quote', e.target.value)}
              rows={3}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-y"
            />
          </Field>
        </Card>

        <Card title='Sección "Quién es"'>
          <Field label="Título">
            <input
              value={content.who_is_title}
              onChange={(e) => set('who_is_title', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <ParagraphListEditor
            label="Párrafos"
            items={content.who_is_paragraphs}
            onChange={(v) => set('who_is_paragraphs', v)}
          />
        </Card>

        <Card title='Sección "Misión"'>
          <Field label="Título">
            <input
              value={content.mission_title}
              onChange={(e) => set('mission_title', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Introducción">
            <textarea
              value={content.mission_intro}
              onChange={(e) => set('mission_intro', e.target.value)}
              rows={2}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-y"
            />
          </Field>
          <ItemListEditor
            label="Items (máx 3, los iconos son fijos)"
            items={content.mission_items}
            onChange={(v) => set('mission_items', v)}
            max={3}
          />
        </Card>

        <Card title='Sección "Método"'>
          <Field label="Título">
            <input
              value={content.method_title}
              onChange={(e) => set('method_title', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="Introducción">
            <textarea
              value={content.method_intro}
              onChange={(e) => set('method_intro', e.target.value)}
              rows={2}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-y"
            />
          </Field>
          <ItemListEditor
            label="Pasos (se numeran automáticamente)"
            items={content.method_steps}
            onChange={(v) => set('method_steps', v)}
          />
        </Card>

        <Card title='Sección "Por qué existe"'>
          <Field label="Título">
            <input
              value={content.why_title}
              onChange={(e) => set('why_title', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <ParagraphListEditor
            label="Párrafos"
            items={content.why_paragraphs}
            onChange={(v) => set('why_paragraphs', v)}
          />
        </Card>

        <Card title="Llamado a la acción (CTA)">
          <Field label="Texto del botón">
            <input
              value={content.cta_label}
              onChange={(e) => set('cta_label', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
          <Field label="URL">
            <input
              value={content.cta_url}
              onChange={(e) => set('cta_url', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary font-mono"
            />
          </Field>
        </Card>

        <Card title="Pie de página">
          <Field label="Texto al final">
            <input
              value={content.footer}
              onChange={(e) => set('footer', e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </Field>
        </Card>
      </div>

      {/* Save button */}
      <div className="sticky bottom-0 bg-background py-4 -mx-4 px-4 mt-6 border-t border-border/50 flex justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-accent">
            <Check className="w-4 h-4" />
            Guardado
          </span>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50 space-y-3">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function ParagraphListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      <div className="space-y-2">
        {items.map((p, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              value={p}
              onChange={(e) => {
                const copy = [...items];
                copy[i] = e.target.value;
                onChange(copy);
              }}
              rows={3}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-y"
              placeholder={`Párrafo ${i + 1}`}
            />
            {items.length > 1 && (
              <button
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="p-2 h-fit hover:bg-card rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-error/60" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ''])}
          className="flex items-center gap-2 text-xs text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar párrafo
        </button>
      </div>
    </div>
  );
}

function ItemListEditor({
  label,
  items,
  onChange,
  max,
}: {
  label: string;
  items: Item[];
  onChange: (v: Item[]) => void;
  max?: number;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-card rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-text-tertiary">#{i + 1}</span>
              <input
                value={item.title}
                onChange={(e) => {
                  const copy = [...items];
                  copy[i] = { ...copy[i], title: e.target.value };
                  onChange(copy);
                }}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-text-primary focus:outline-none focus:border-primary"
                placeholder="Título"
              />
              {items.length > 1 && (
                <button
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  className="p-1.5 hover:bg-background rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-error/60" />
                </button>
              )}
            </div>
            <textarea
              value={item.description}
              onChange={(e) => {
                const copy = [...items];
                copy[i] = { ...copy[i], description: e.target.value };
                onChange(copy);
              }}
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary resize-y"
              placeholder="Descripción"
            />
          </div>
        ))}
        {(!max || items.length < max) && (
          <button
            onClick={() => onChange([...items, { title: '', description: '' }])}
            className="flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar item
          </button>
        )}
      </div>
    </div>
  );
}
