import { useState, useEffect, useCallback } from 'react';
import { Trash2, Download, Mail, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WhitelistEntry {
  id: string;
  email: string;
  created_at: string;
}

export function WhitelistPage() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('whitelist')
      .select('*')
      .order('created_at', { ascending: false });
    setEntries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este email de la whitelist?')) return;
    await supabase.from('whitelist').delete().eq('id', id);
    load();
  };

  const handleExportCSV = () => {
    const csv = 'email,fecha\n' + entries.map(e =>
      `${e.email},${new Date(e.created_at).toLocaleDateString('es-AR')}`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentio_whitelist_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = search
    ? entries.filter(e => e.email.toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Whitelist</h1>
          <p className="text-text-secondary mt-1">
            {entries.length} {entries.length === 1 ? 'persona registrada' : 'personas registradas'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border/50 text-text-primary rounded-xl text-sm font-medium hover:bg-card transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary/50"
        />
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">
          Cargando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{search ? 'Sin resultados' : 'Aún no hay registros'}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Fecha</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-text-primary">{entry.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-secondary">
                      {new Date(entry.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 hover:bg-card rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-error/60" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
