// ===========================
// API Client - Fetch wrapper with JWT
// ===========================

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token || localStorage.getItem('quizai_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set default Content-Type if it's not a FormData request
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)['Content-Type'] = 
        (options.headers as Record<string, string>)?.['Content-Type'] || 'application/json';
    }

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('quizai_token');
      localStorage.removeItem('quizai_user');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Something went wrong');
    }

    return data;
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, options);
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      ...options,
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      ...options,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
