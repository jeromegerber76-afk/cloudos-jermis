import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../auth/ProtectedRoute';
import {
  HomeIcon,
  ClockIcon,
  CurrencyEuroIcon,
  ArchiveBoxIcon,
  DocumentIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { hasPermission } = usePermissions();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      permission: null // Alle können das Dashboard sehen
    },
    {
      name: 'Zeiterfassung',
      href: '/timesheet',
      icon: ClockIcon,
      permission: 'timesheet'
    },
    {
      name: 'Spesen',
      href: '/expenses',
      icon: CurrencyEuroIcon,
      permission: 'expense_submission'
    },
    {
      name: 'Dateien',
      href: '/files',
      icon: DocumentIcon,
      permission: 'file_upload'
    },
    {
      name: 'Lager & Inventar',
      href: '/inventory',
      icon: ArchiveBoxIcon,
      permission: 'inventory_management'
    },
    {
      name: 'Berichte',
      href: '/reports',
      icon: ChartBarIcon,
      permission: 'financial_data'
    },
    {
      name: 'Benutzerverwaltung',
      href: '/admin/users',
      icon: UserGroupIcon,
      permission: 'user_management'
    },
    {
      name: 'Systemeinstellungen',
      href: '/admin/settings',
      icon: CogIcon,
      permission: 'system_settings'
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.permission || hasPermission(item.permission as any)
  );

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onClose}
              >
                <span className="sr-only">Sidebar schließen</span>
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={filteredNavigation} isActive={isActive} onItemClick={onClose} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="flex flex-col w-full bg-white border-r border-gray-200">
        <SidebarContent navigation={filteredNavigation} isActive={isActive} />
      </div>
    </>
  );
};

interface SidebarContentProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    permission: string | null;
  }>;
  isActive: (href: string) => boolean;
  onItemClick?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ navigation, isActive, onItemClick }) => {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-600">
        <Link to="/dashboard" className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary-600 font-bold text-sm">CJ</span>
          </div>
          <span className="ml-3 text-white font-semibold text-lg">
            CloudOS.Jermis
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
                onClick={onItemClick}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} 
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div>
              <p className="text-xs font-medium text-gray-700">CloudOS.Jermis</p>
              <p className="text-xs text-gray-500">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;