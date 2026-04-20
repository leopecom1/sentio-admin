import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Settings,
  MessageSquare,
  LogOut,
  Trophy,
  Mail,
  ClipboardList,
  Scale,
  Info,
  ShieldCheck,
  UserCheck,
  Send,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/approvals', icon: UserCheck, label: 'Aprobar cuentas' },
  { to: '/users', icon: Users, label: 'Usuarios' },
  { to: '/analytics', icon: BarChart3, label: 'Analíticas' },
  { to: '/content', icon: FileText, label: 'Contenido' },
  { to: '/gamification', icon: Trophy, label: 'Gamificación' },
  { to: '/whitelist', icon: Mail, label: 'Whitelist' },
  { to: '/assessments', icon: ClipboardList, label: 'Evaluaciones' },
  { to: '/validations', icon: ShieldCheck, label: 'Validaciones' },
  { to: '/legal', icon: Scale, label: 'Legal' },
  { to: '/about', icon: Info, label: 'Sobre B2Better' },
  { to: '/conversations', icon: MessageSquare, label: 'Conversaciones' },
  { to: '/email-tests', icon: Send, label: 'Pruebas de email' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

interface SidebarProps {
  onSignOut?: () => void;
}

export function Sidebar({ onSignOut }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <img src="/logo.svg" alt="B2Better" className="h-7 opacity-90" />
        <p className="text-xs text-white/40 mt-2 tracking-wide">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-sidebar-hover transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        )}
        <p className="text-xs text-white/30 text-center mt-3">B2Better Admin v1.0</p>
      </div>
    </aside>
  );
}
