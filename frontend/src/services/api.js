// Same-origin requests work locally and through private Codespaces forwarding.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

// Migrate old installations once; logout then clears only the current namespace.
for (const [oldKey, newKey] of [['aura_auth_token', 'career_lens_auth_token'], ['aura_current_analysis_id', 'career_lens_current_analysis_id']]) {
  const oldValue = localStorage.getItem(oldKey);
  if (oldValue && !localStorage.getItem(newKey)) localStorage.setItem(newKey, oldValue);
  localStorage.removeItem(oldKey);
}

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('career_lens_auth_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('career_lens_auth_token', token);
    } else {
      localStorage.removeItem('career_lens_auth_token');
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
        let errorMsg = `API request failed (HTTP ${response.status}). Check that the backend is running.`;
        if (typeof data === 'object' && data !== null && data.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail
            : Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join('; ')
            : [data.detail.message, ...(data.detail.files || []).map((item) => `${item.filename}: ${item.error}`)].filter(Boolean).join(' ');
        } else if (typeof data === 'string' && data.length > 0 && !contentType?.includes('text/html')) {
          errorMsg = data;
        } else if (contentType?.includes('text/html')) {
          errorMsg = `The API returned a web page instead of JSON (HTTP ${response.status}). Check the frontend API proxy and Codespaces port forwarding.`;
        }
        throw new Error(errorMsg);
      }

      if (!contentType?.includes('application/json')) {
        throw new Error('The API returned a web page or empty response instead of JSON. Restart the frontend with the updated API proxy configuration.');
      }
      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      if (err instanceof TypeError) {
        throw new Error('Cannot reach the Career Lens API. Start the backend on port 8000 and restart the frontend. In Codespaces, use the frontend port 5173 URL.');
      }
      throw err;
    }
  }

  listCampaigns() { return this.request('/api/hr/campaigns'); }
  createCampaign(body) { return this.request('/api/hr/campaigns', { method: 'POST', body }); }
  getCampaign(id) { return this.request(`/api/hr/campaigns/${id}`); }
  reviewApplicant(campaignId, applicantId, body) {
    return this.request(`/api/hr/campaigns/${campaignId}/applicants/${applicantId}`, { method: 'PATCH', body: JSON.stringify(body) });
  }
  previewEmails(id, message) {
    return this.request(`/api/hr/campaigns/${id}/emails/preview`, { method: 'POST', body: JSON.stringify({ message }) });
  }
  sendEmails(id, message, preview_token) {
    return this.request(`/api/hr/campaigns/${id}/emails/send`, { method: 'POST', body: JSON.stringify({ message, preview_token }) });
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
    localStorage.removeItem('career_lens_current_analysis_id');
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
