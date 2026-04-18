import { useState } from 'react';
import {
  Trophy,
  Star,
  Layers,
  Trash2,
  Plus,
  Save,
  X,
  Zap,
} from 'lucide-react';
import {
  usePointRules,
  useLevels,
  useAchievements,
  type PointRule,
  type GamificationLevel,
  type GamificationAchievement,
} from '../hooks/useGamificationData';

type Tab = 'rules' | 'levels' | 'achievements';

export function GamificationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('rules');

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gamificación</h1>
          <p className="text-text-secondary mt-1">
            Configurá puntos, niveles y logros de la app
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card p-1 rounded-xl mb-6 w-fit">
        <TabButton
          icon={<Zap className="w-4 h-4" />}
          label="Reglas de Puntos"
          active={activeTab === 'rules'}
          onClick={() => setActiveTab('rules')}
        />
        <TabButton
          icon={<Layers className="w-4 h-4" />}
          label="Niveles"
          active={activeTab === 'levels'}
          onClick={() => setActiveTab('levels')}
        />
        <TabButton
          icon={<Trophy className="w-4 h-4" />}
          label="Logros"
          active={activeTab === 'achievements'}
          onClick={() => setActiveTab('achievements')}
        />
      </div>

      {activeTab === 'rules' && <PointRulesTab />}
      {activeTab === 'levels' && <LevelsTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
    </div>
  );
}

// ── Tab Button ──

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-surface text-text-primary shadow-sm'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ══════════════════════════════════════════
// Point Rules Tab
// ══════════════════════════════════════════

function PointRulesTab() {
  const { rules, loading, updateRule, createRule, deleteRule } = usePointRules();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PointRule>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    action_key: '',
    label: '',
    description: '',
    xp_amount: 10,
    icon: 'star',
    category: 'general',
    is_active: true,
  });

  const startEdit = (rule: PointRule) => {
    setEditingId(rule.id);
    setEditValues({ xp_amount: rule.xp_amount, label: rule.label, is_active: rule.is_active });
  };

  const saveEdit = async (id: string) => {
    await updateRule(id, editValues);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newRule.action_key || !newRule.label) return;
    await createRule(newRule);
    setShowCreate(false);
    setNewRule({ action_key: '', label: '', description: '', xp_amount: 10, icon: 'star', category: 'general', is_active: true });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta regla de puntos?')) return;
    await deleteRule(id);
  };

  if (loading) {
    return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando reglas...</div>;
  }

  // Group by category
  const categories = [...new Set(rules.map((r) => r.category))];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva regla
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-primary/20 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Nueva regla de puntos</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Clave (ej: checkin)"
              value={newRule.action_key}
              onChange={(e) => setNewRule({ ...newRule, action_key: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              placeholder="Nombre visible"
              value={newRule.label}
              onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              placeholder="Descripción"
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              type="number"
              placeholder="XP"
              value={newRule.xp_amount}
              onChange={(e) => setNewRule({ ...newRule, xp_amount: parseInt(e.target.value) || 0 })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary"
            />
            <input
              placeholder="Categoría"
              value={newRule.category}
              onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              placeholder="Icono (Material Icon)"
              value={newRule.icon}
              onChange={(e) => setNewRule({ ...newRule, icon: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-2">
            {cat}
          </h3>
          <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase">Acción</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase">Nombre</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase">XP</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rules
                  .filter((r) => r.category === cat)
                  .map((rule) => (
                    <tr key={rule.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                      <td className="px-6 py-3">
                        <code className="text-xs bg-card px-2 py-1 rounded text-text-secondary">{rule.action_key}</code>
                      </td>
                      <td className="px-6 py-3">
                        {editingId === rule.id ? (
                          <input
                            value={editValues.label ?? rule.label}
                            onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
                            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary w-full"
                          />
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-text-primary">{rule.label}</p>
                            {rule.description && <p className="text-xs text-text-tertiary">{rule.description}</p>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {editingId === rule.id ? (
                          <input
                            type="number"
                            value={editValues.xp_amount ?? rule.xp_amount}
                            onChange={(e) => setEditValues({ ...editValues, xp_amount: parseInt(e.target.value) || 0 })}
                            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary w-20"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-primary flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" />
                            {rule.xp_amount}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() =>
                            editingId === rule.id
                              ? setEditValues({ ...editValues, is_active: !(editValues.is_active ?? rule.is_active) })
                              : updateRule(rule.id, { is_active: !rule.is_active })
                          }
                          className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer ${
                            (editingId === rule.id ? editValues.is_active ?? rule.is_active : rule.is_active)
                              ? 'bg-accent/15 text-accent'
                              : 'bg-warning/15 text-warning'
                          }`}
                        >
                          {(editingId === rule.id ? editValues.is_active ?? rule.is_active : rule.is_active) ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          {editingId === rule.id ? (
                            <>
                              <button onClick={() => saveEdit(rule.id)} className="p-2 hover:bg-card rounded-lg transition-colors">
                                <Save className="w-4 h-4 text-accent" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-2 hover:bg-card rounded-lg transition-colors">
                                <X className="w-4 h-4 text-text-tertiary" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(rule)} className="p-2 hover:bg-card rounded-lg transition-colors text-xs text-text-secondary">
                                Editar
                              </button>
                              <button onClick={() => handleDelete(rule.id)} className="p-2 hover:bg-card rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4 text-error/60" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// Levels Tab
// ══════════════════════════════════════════

function LevelsTab() {
  const { levels, loading, updateLevel, createLevel, deleteLevel } = useLevels();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<GamificationLevel>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newLevel, setNewLevel] = useState({ level: 1, title: '', xp_required: 0, icon: 'shield' });

  const startEdit = (lvl: GamificationLevel) => {
    setEditingId(lvl.id);
    setEditValues({ title: lvl.title, xp_required: lvl.xp_required });
  };

  const saveEdit = async (id: string) => {
    await updateLevel(id, editValues);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!newLevel.title) return;
    await createLevel(newLevel);
    setShowCreate(false);
    setNewLevel({ level: (levels.length || 0) + 2, title: '', xp_required: 0, icon: 'shield' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este nivel?')) return;
    await deleteLevel(id);
  };

  if (loading) {
    return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando niveles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo nivel
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-primary/20 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Nuevo nivel</h3>
          <div className="grid grid-cols-4 gap-4">
            <input
              type="number"
              placeholder="Nivel"
              value={newLevel.level}
              onChange={(e) => setNewLevel({ ...newLevel, level: parseInt(e.target.value) || 1 })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary"
            />
            <input
              placeholder="Título"
              value={newLevel.title}
              onChange={(e) => setNewLevel({ ...newLevel, title: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              type="number"
              placeholder="XP requerido"
              value={newLevel.xp_required}
              onChange={(e) => setNewLevel({ ...newLevel, xp_required: parseInt(e.target.value) || 0 })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary"
            />
            <input
              placeholder="Icono"
              value={newLevel.icon}
              onChange={(e) => setNewLevel({ ...newLevel, icon: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className="bg-surface rounded-2xl p-5 shadow-sm border border-border/50 relative group"
          >
            {editingId === lvl.id ? (
              <div className="space-y-3">
                <input
                  value={editValues.title ?? lvl.title}
                  onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                  className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary w-full"
                />
                <input
                  type="number"
                  value={editValues.xp_required ?? lvl.xp_required}
                  onChange={(e) => setEditValues({ ...editValues, xp_required: parseInt(e.target.value) || 0 })}
                  className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary w-full"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(lvl.id)} className="text-xs text-accent hover:underline">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-text-tertiary hover:underline">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{lvl.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{lvl.title}</p>
                    <p className="text-xs text-text-tertiary">{lvl.xp_required.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(lvl)} className="text-xs text-text-secondary hover:text-text-primary">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(lvl.id)} className="text-xs text-error/60 hover:text-error">
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Achievements Tab
// ══════════════════════════════════════════

function AchievementsTab() {
  const { achievements, loading, updateAchievement, createAchievement, deleteAchievement } = useAchievements();
  const [showCreate, setShowCreate] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    achievement_key: '',
    name: '',
    description: '',
    icon: 'emoji_events',
    category: 'general',
    condition_type: 'count',
    condition_field: 'total_checkins',
    condition_value: 1,
    xp_reward: 50,
    is_active: true,
    sort_order: 0,
  });

  const handleCreate = async () => {
    if (!newAchievement.achievement_key || !newAchievement.name) return;
    await createAchievement({
      ...newAchievement,
      sort_order: achievements.length + 1,
    });
    setShowCreate(false);
    setNewAchievement({
      achievement_key: '',
      name: '',
      description: '',
      icon: 'emoji_events',
      category: 'general',
      condition_type: 'count',
      condition_field: 'total_checkins',
      condition_value: 1,
      xp_reward: 50,
      is_active: true,
      sort_order: 0,
    });
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    await updateAchievement(id, { is_active: !currentlyActive });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este logro?')) return;
    await deleteAchievement(id);
  };

  if (loading) {
    return <div className="bg-surface rounded-2xl p-12 text-center text-text-tertiary">Cargando logros...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo logro
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-primary/20 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Nuevo logro</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Clave (ej: first_checkin)"
              value={newAchievement.achievement_key}
              onChange={(e) => setNewAchievement({ ...newAchievement, achievement_key: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              placeholder="Nombre visible"
              value={newAchievement.name}
              onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              placeholder="Descripción"
              value={newAchievement.description}
              onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              placeholder="Icono"
              value={newAchievement.icon}
              onChange={(e) => setNewAchievement({ ...newAchievement, icon: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <select
              value={newAchievement.category}
              onChange={(e) => setNewAchievement({ ...newAchievement, category: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary"
            >
              <option value="checkin">Check-in</option>
              <option value="journal">Diario</option>
              <option value="tools">Herramientas</option>
              <option value="chat">Chat</option>
              <option value="community">Comunidad</option>
              <option value="finance">Finanzas</option>
              <option value="milestone">Hito</option>
              <option value="general">General</option>
            </select>
            <input
              placeholder="Campo condición (ej: total_checkins)"
              value={newAchievement.condition_field || ''}
              onChange={(e) => setNewAchievement({ ...newAchievement, condition_field: e.target.value })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
            />
            <input
              type="number"
              placeholder="Valor condición"
              value={newAchievement.condition_value}
              onChange={(e) => setNewAchievement({ ...newAchievement, condition_value: parseInt(e.target.value) || 1 })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary"
            />
            <input
              type="number"
              placeholder="Recompensa XP"
              value={newAchievement.xp_reward}
              onChange={(e) => setNewAchievement({ ...newAchievement, xp_reward: parseInt(e.target.value) || 0 })}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Logro</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Categoría</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Condición</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Recompensa</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-text-tertiary uppercase">Estado</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((ach) => (
              <tr key={ach.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{ach.name}</p>
                    <p className="text-xs text-text-tertiary">{ach.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-card px-3 py-1 rounded-full text-text-secondary">
                    {ach.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs bg-card px-2 py-1 rounded text-text-secondary">
                    {ach.condition_field} ≥ {ach.condition_value}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-primary flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {ach.xp_reward} XP
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(ach.id, ach.is_active)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer ${
                      ach.is_active
                        ? 'bg-accent/15 text-accent'
                        : 'bg-warning/15 text-warning'
                    }`}
                  >
                    {ach.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(ach.id)}
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
    </div>
  );
}
