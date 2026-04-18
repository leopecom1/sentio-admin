import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  onSignOut?: () => void;
}

export function Layout({ onSignOut }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar onSignOut={onSignOut} />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
