import { apiService } from './api.service';
import { AuthResponse, LoginCredentials, RegisterData, User } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class AuthService {
  private baseUrl = `${API_BASE_URL}/api/auth`;

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login fehlgeschlagen');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Auth Service - Login Error:', error);
      throw new Error(error.message || 'Verbindung zum Server fehlgeschlagen');
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrierung fehlgeschlagen');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Auth Service - Register Error:', error);
      throw new Error(error.message || 'Verbindung zum Server fehlgeschlagen');
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Auth Service - Logout Error:', error);
      // Logout sollte auch bei Netzwerkfehlern funktionieren
    }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token ungültig');
      }

      const data = await response.json();
      return data.user;
    } catch (error: any) {
      console.error('Auth Service - Token Verification Error:', error);
      throw new Error('Token-Verifizierung fehlgeschlagen');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get('/auth/me');
      return response.data;
    } catch (error: any) {
      console.error('Auth Service - Get Current User Error:', error);
      throw new Error('Benutzerdaten konnten nicht geladen werden');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token-Erneuerung fehlgeschlagen');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Auth Service - Refresh Token Error:', error);
      throw new Error('Token-Erneuerung fehlgeschlagen');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Passwort-Reset fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Auth Service - Password Reset Error:', error);
      throw new Error(error.message || 'Passwort-Reset fehlgeschlagen');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Passwort-Änderung fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Auth Service - Reset Password Error:', error);
      throw new Error(error.message || 'Passwort-Änderung fehlgeschlagen');
    }
  }
}

export const authService = new AuthService();