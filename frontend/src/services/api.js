const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('aura_auth_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('aura_auth_token', token);
    } else {
      localStorage.removeItem('aura_auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if not sending FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        let errorMsg = 'An unexpected error occurred.';
        if (typeof data === 'object' && data !== null && data.detail) {
          errorMsg = data.detail;
        } else if (typeof data === 'string' && data.length > 0) {
          errorMsg = data;
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // --- Auth Endpoints ---
  async signup(name, email, password) {
    const data = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('aura_current_analysis_id');
  }

  // --- Analysis Endpoints ---
  async uploadAnalysis(formData) {
    return this.request('/api/analyses/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getAnalysisStatus(analysisId) {
    return this.request(`/api/analyses/${analysisId}/status`);
  }

  async getAnalysis(analysisId) {
    return this.request(`/api/analyses/${analysisId}`);
  }

  async listAnalyses() {
    return this.request('/api/analyses');
  }

  async deleteAnalysis(analysisId) {
    return this.request(`/api/analyses/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // --- Interview Endpoints ---
  async submitInterviewAnswer(analysisId, questionId, answerText, speechMetrics = null) {
    return this.request(`/api/analyses/${analysisId}/interview/answer`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        answer_text: answerText,
        speech_metrics: speechMetrics,
      }),
    });
  }

  async getInterviewSummary(analysisId) {
    return this.request(`/api/analyses/${analysisId}/interview/summary`);
  }

  // --- What-If Endpoints ---
  async runWhatIf(analysisId, payload) {
    return this.request(`/api/analyses/${analysisId}/what-if`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
export default api;
