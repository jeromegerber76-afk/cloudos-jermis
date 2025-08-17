import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole, ROLE_PERMISSIONS, Permission } from '../../services/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Benutzerinformationen...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check Role Requirements
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          from: location,
          message: `Diese Seite erfordert die Rolle: ${requiredRole}` 
        }} 
        replace 
      />
    );
  }

  // Check Permission Requirements
  if (requiredPermissions.length > 0) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission) || userPermissions.includes('all_modules')
    );

    if (!hasAllPermissions) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            from: location,
            message: 'Sie haben keine Berechtigung für diese Seite' 
          }} 
          replace 
        />
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

// HOC for easier usage
export const withAuth = (
  Component: React.ComponentType,
  options?: {
    requiredPermissions?: Permission[];
    requiredRole?: UserRole;
    fallbackPath?: string;
  }
) => {
  return function AuthenticatedComponent(props: any) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Permission Check Hook
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('all_modules');
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const canAccess = (requiredPermissions: Permission[]): boolean => {
    if (!user) return false;
    
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  return {
    user,
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccess,
    userPermissions: user ? ROLE_PERMISSIONS[user.role] || [] : []
  };
};

export default ProtectedRoute;