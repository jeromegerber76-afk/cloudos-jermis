// User & Auth Types für CloudOS.Jermis
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  BUCHHALTUNG = 'BUCHHALTUNG',
  LAGER = 'LAGER',
  MITARBEITER = 'MITARBEITER',
  EXTERNE = 'EXTERNE'
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// Auth Context Types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Dashboard Types
export interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  pendingTasks: number;
  monthlyRevenue: number;
}

// Permissions basierend auf Rollen
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'user_management',
    'system_settings',
    'audit_logs',
    'all_modules'
  ],
  [UserRole.SUPPORT]: [
    'user_support',
    'ticket_management',
    'system_monitoring'
  ],
  [UserRole.BUCHHALTUNG]: [
    'financial_data',
    'expense_reports',
    'invoice_management',
    'accounting_exports'
  ],
  [UserRole.LAGER]: [
    'inventory_management',
    'stock_control',
    'warehouse_operations'
  ],
  [UserRole.MITARBEITER]: [
    'timesheet',
    'expense_submission',
    'file_upload',
    'own_data'
  ],
  [UserRole.EXTERNE]: [
    'limited_access',
    'assigned_projects_only'
  ]
} as const;

export type Permission = typeof ROLE_PERMISSIONS[UserRole][number];