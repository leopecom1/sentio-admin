import { useState, useEffect, useCallback } from 'react';
import { FileText, Shield, Save, Plus, Trash2, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

type DocType = 'terms' | 'privacy';

interface LegalSection {
  title: string;
  body: string;
}

interface LegalDoc {
  id?: string;
  doc_type: DocType;
  version: string;
  last_updated: string;
  sections: LegalSection[];
  updated_at?: string;
}

export function LegalDocsPage() {
  const [activeTab, setActiveTab] = useState<DocType>('terms');

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Documentos legales</h1>
          <p className="text-text-secondary mt-1">
            Editá los Términos y la Política de Privacidad que ve el usuario
          </p>
        </div>
      </div>

      <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 w-fit">
        <TabButton
          icon={<FileText className="w-4 h-4" />}
          label="Términos y Condiciones"
          active={activeTab === 'terms'}
          onClick={() => setActiveTab('terms')}
        />
        <TabButton
          icon={<Shield className="w-4 h-4" />}
          label="Política de Privacidad"
          active={activeTab === 'privacy'}
          onClick={() => setActiveTab('privacy')}
        />
      </div>

      <DocEditor key={activeTab} docType={activeTab} />
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

function DocEditor({ docType }: { docType: DocType }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('doc_type', docType)
      .maybeSingle();

    if (data) {
      setDoc(data as LegalDoc);
    } else {
      // Initialize with empty doc
      setDoc({
        doc_type: docType,
        version: '1.0',
        last_updated: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
        sections: [],
      });
    }
    setLoading(false);
  }, [docType]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    setSaved(false);

    const payload = {
      doc_type: doc.doc_type,
      version: doc.version,
      last_updated: doc.last_updated,
      sections: doc.sections,
      updated_at: new Date().toISOString(),
    };

    // Upsert by doc_type
    const { error } = doc.id
      ? await supabase.from('legal_documents').update(payload).eq('id', doc.id)
      : await supabase.from('legal_documents').insert(payload);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    }
  };

  const addSection = () => {
    if (!doc) return;
    setDoc({
      ...doc,
      sections: [...doc.sections, { title: `${doc.sections.length + 1}. Nueva sección`, body: '' }],
    });
  };

  const updateSection = (i: number, patch: Partial<LegalSection>) => {
    if (!doc) return;
    const newSections = [...doc.sections];
    newSections[i] = { ...newSections[i], ...patch };
    setDoc({ ...doc, sections: newSections });
  };

  const deleteSection = (i: number) => {
    if (!doc) return;
    if (!confirm(`¿Eliminar sección "${doc.sections[i].title}"?`)) return;
    setDoc({ ...doc, sections: doc.sections.filter((_, idx) => idx !== i) });
  };

  const moveSection = (i: number, dir: -1 | 1) => {
    if (!doc) return;
    const newSections = [...doc.sections];
    const target = i + dir;
    if (target < 0 || target >= newSections.length) return;
    [newSections[i], newSections[target]] = [newSections[target], newSections[i]];
    setDoc({ ...doc, sections: newSections });
  };

  if (loading) return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando...</div>;
  if (!doc) return null;

  return (
    <div className="space-y-4">
      {/* Header with metadata */}
      <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Versión</label>
            <input
              type="text"
              value={doc.version}
              onChange={(e) => setDoc({ ...doc, version: e.target.value })}
              className="mt-1.5 w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              placeholder="1.0"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Última actualización</label>
            <input
              type="text"
              value={doc.last_updated}
              onChange={(e) => setDoc({ ...doc, last_updated: e.target.value })}
              className="mt-1.5 w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              placeholder="18 de abril de 2026"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      {doc.sections.map((section, i) => (
        <div key={i} className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider px-2 py-1 bg-card rounded">
              {i + 1}
            </span>
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(i, { title: e.target.value })}
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm font-semibold text-text-primary focus:outline-none focus:border-primary"
              placeholder="Título de la sección"
            />
            <button
              onClick={() => moveSection(i, -1)}
              disabled={i === 0}
              className="p-2 hover:bg-card rounded-lg transition-colors disabled:opacity-30"
              title="Mover arriba"
            >
              <ArrowUp className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={() => moveSection(i, 1)}
              disabled={i === doc.sections.length - 1}
              className="p-2 hover:bg-card rounded-lg transition-colors disabled:opacity-30"
              title="Mover abajo"
            >
              <ArrowDown className="w-4 h-4 text-text-secondary" />
            </button>
            <button
              onClick={() => deleteSection(i)}
              className="p-2 hover:bg-card rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4 text-error/60" />
            </button>
          </div>
          <textarea
            value={section.body}
            onChange={(e) => updateSection(i, { body: e.target.value })}
            rows={6}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-y font-mono leading-relaxed"
            placeholder="Contenido de la sección..."
          />
        </div>
      ))}

      {/* Add section button */}
      <button
        onClick={addSection}
        className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar sección
      </button>

      {/* Save button (sticky at bottom) */}
      <div className="sticky bottom-0 bg-background py-4 -mx-4 px-4 border-t border-border/50 flex justify-end gap-3">
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
