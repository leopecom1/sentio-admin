import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import { EMOTIONS, formatDate } from '../lib/utils';
import { useUsers } from '../hooks/useSupabaseData';

export function UsersPage() {
  const { users, loading, searchUsers } = useUsers();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const searched = search ? searchUsers(search) : users;
  const filtered = searched.filter((user) => {
    return planFilter === 'all' || user.plan === planFilter;
  });

  if (loading) {
    return (
      <div className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Usuarios</h1>
          <p className="text-text-secondary mt-1">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Usuarios</h1>
        <p className="text-text-secondary mt-1">Gestión y monitoreo de usuarios de Sentio</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Todos los planes</option>
          <option value="free">Gratuito</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Plan</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Emoción</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Racha</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Check-ins</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Última actividad</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Registro</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-text-tertiary text-sm">
                  {search || planFilter !== 'all' ? 'No se encontraron usuarios' : 'Sin usuarios aún'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const emotion = user.last_emotion ? EMOTIONS[user.last_emotion] : null;
                return (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                          {(user.full_name ?? '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{user.full_name ?? 'Sin nombre'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.plan === 'premium'
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-card text-text-tertiary'
                      }`}>
                        {user.plan === 'premium' ? 'Premium' : 'Gratuito'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emotion ? (
                        <>
                          <span className="text-lg" title={emotion.label}>{emotion.emoji}</span>
                          <span className="text-xs text-text-tertiary ml-2">{emotion.label}</span>
                        </>
                      ) : (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${user.checkin_streak > 0 ? 'text-accent' : 'text-text-tertiary'}`}>
                        🔥 {user.checkin_streak}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-primary">{user.total_checkins}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary">
                        {user.last_active_at ? formatDate(user.last_active_at) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-tertiary">{formatDate(user.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-card rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-text-tertiary" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-4 text-sm text-text-tertiary">
        <p>Mostrando {filtered.length} de {users.length} usuarios</p>
        <p>{users.filter(u => u.plan === 'premium').length} premium · {users.filter(u => u.plan === 'free').length} gratuitos</p>
      </div>
    </div>
  );
}
