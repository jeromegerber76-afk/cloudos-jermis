import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../components/auth/ProtectedRoute';
import Layout from '../../components/layout/Layout';
import { 
  ClockIcon, 
  CurrencyEuroIcon, 
  ArchiveBoxIcon, 
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalUsers: number;
  pendingExpenses: number;
  lowStockItems: number;
  hoursThisWeek: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission, canAccess } = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingExpenses: 0,
    lowStockItems: 0,
    hoursThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Lade Dashboard-Daten vom Backend
    const loadDashboardData = async () => {
      try {
        // Simuliere API-Call
        setTimeout(() => {
          setStats({
            totalUsers: 12,
            pendingExpenses: 3,
            lowStockItems: 5,
            hoursThisWeek: 32.5
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const quickActions = [
    {
      title: 'Zeiterfassung',
      description: 'Arbeitszeiten erfassen',
      icon: ClockIcon,
      href: '/timesheet',
      permission: 'timesheet',
      color: 'bg-blue-500'
    },
    {
      title: 'Spesen einreichen',
      description: 'Belege hochladen',
      icon: CurrencyEuroIcon,
      href: '/expenses',
      permission: 'expense_submission',
      color: 'bg-green-500'
    },
    {
      title: 'Lager verwalten',
      description: 'Inventar überprüfen',
      icon: ArchiveBoxIcon,
      href: '/inventory',
      permission: 'inventory_management',
      color: 'bg-purple-500'
    },
    {
      title: 'Benutzer verwalten',
      description: 'Admin-Bereich',
      icon: UserGroupIcon,
      href: '/admin',
      permission: 'user_management',
      color: 'bg-red-500'
    }
  ];

  const stats_cards = [
    {
      title: 'Stunden diese Woche',
      value: stats.hoursThisWeek,
      suffix: 'h',
      icon: ClockIcon,
      color: 'text-blue-600',
      showAll: true
    },
    {
      title: 'Offene Spesen',
      value: stats.pendingExpenses,
      icon: CurrencyEuroIcon,
      color: 'text-green-600',
      showAll: true
    },
    {
      title: 'Niedrige Bestände',
      value: stats.lowStockItems,
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600',
      showIf: hasPermission('inventory_management')
    },
    {
      title: 'Aktive Benutzer',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'text-purple-600',
      showIf: hasPermission('user_management')
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner h-8 w-8 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.name}!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Willkommen zurück in CloudOS.Jermis - {user?.role}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('de-DE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats_cards
            .filter(card => card.showAll || card.showIf)
            .map((card, index) => (
              <div key={index} className="bg-white overflow-hidden shadow-sm rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {card.title}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {card.value}{card.suffix}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Schnellzugriff
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions
                .filter(action => hasPermission(action.permission as any))
                .map((action, index) => (
                  <Link
                    key={index}
                    to={action.href}
                    className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div>
                      <span className={`${action.color} rounded-lg inline-flex p-3 ring-4 ring-white`}>
                        <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                    <span
                      className="absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                      aria-hidden="true"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                      </svg>
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Letzte Aktivitäten
            </h2>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                <li className="py-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Zeiterfassung für heute eingereicht
                      </p>
                      <p className="text-sm text-gray-500">
                        vor 2 Stunden
                      </p>
                    </div>
                  </div>
                </li>
                <li className="py-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <CurrencyEuroIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Spesen-Beleg hochgeladen
                      </p>
                      <p className="text-sm text-gray-500">
                        gestern
                      </p>
                    </div>
                  </div>
                </li>
                <li className="py-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ArchiveBoxIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Inventar aktualisiert
                      </p>
                      <p className="text-sm text-gray-500">
                        vor 3 Tagen
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;