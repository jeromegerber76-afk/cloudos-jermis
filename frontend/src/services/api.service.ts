import { ApiResponse, ApiError } from './types';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private baseUrl = `${API_BASE_URL}/api`;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = Cookies.get('auth_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      // Handle verschiedene HTTP Status Codes
      if (response.status === 401) {
        // Token abgelaufen - User ausloggen
        Cookies.remove('auth_token');
        window.location.href = '/login';
        throw new Error('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
      }

      if (response.status === 403) {
        throw new Error('Keine Berechtigung für diese Aktion.');
      }

      if (response.status === 404) {
        throw new Error('Ressource nicht gefunden.');
      }

      if (response.status >= 500) {
        throw new Error('Serverfehler. Bitte versuchen Sie es später erneut.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        const apiError: ApiError = {
          message: errorData.message || 'Ein Fehler ist aufgetreten',
          status: response.status,
          errors: errorData.errors
        };
        throw apiError;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Service Error [${endpoint}]:`, error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Verbindung zum Server fehlgeschlagen. Prüfen Sie Ihre Internetverbindung.');
      }
      
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // File Upload mit FormData
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = Cookies.get('auth_token');
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Content-Type wird automatisch von FormData gesetzt
      },
      credentials: 'include',
      body: formData,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload fehlgeschlagen');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`API Service Upload Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health Check für Backend-Verbindung
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      return response.ok;
    } catch (error) {
      console.error('Backend Health Check failed:', error);
      return false;
    }
  }

  // Batch Requests für bessere Performance
  async batch<T>(requests: Array<{ endpoint: string; method: string; data?: any }>): Promise<ApiResponse<T[]>> {
    return this.post<T[]>('/batch', { requests });
  }
}

export const apiService = new ApiService();