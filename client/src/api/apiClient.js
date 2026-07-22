// ─────────────────────────────────────────────────────────
// DukaPOS API Client — Real Django Backend
// ─────────────────────────────────────────────────────────

const API_BASE = '/api';

// ── Helpers ──────────────────────────────────────────────

const getToken = () =>
  localStorage.getItem('dukapos_access_token') || localStorage.getItem('token');

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  // For binary responses (PDF downloads)
  if (options.responseType === 'arraybuffer') {
    if (!res.ok) {
      const err = new Error('Request failed');
      err.status = res.status;
      throw err;
    }
    const data = await res.arrayBuffer();
    return { data };
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error || data?.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};


// ── Entity API Factory ──────────────────────────────────

const makeEntityAPI = (entityName) => ({
  list: async (sortString = '', limit = 0) => {
    const params = new URLSearchParams();
    if (sortString) params.set('sort', sortString);
    if (limit > 0) params.set('limit', String(limit));
    const qs = params.toString();
    return request(`/entities/${entityName}${qs ? '?' + qs : ''}`);
  },

  get: async (id) => {
    return request(`/entities/${entityName}/${id}`);
  },

  create: async (data) => {
    return request(`/entities/${entityName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return request(`/entities/${entityName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return request(`/entities/${entityName}/${id}`, {
      method: 'DELETE',
    });
  },

  filter: async (criteria) => {
    return request(`/entities/${entityName}/filter`, {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  },
});


// ── All Entity Endpoints ─────────────────────────────────

const entities = {
  BusinessSettings: makeEntityAPI('BusinessSettings'),
  CashFlow: makeEntityAPI('CashFlow'),
  Customer: makeEntityAPI('Customer'),
  EmployeeRating: makeEntityAPI('EmployeeRating'),
  EmployeeSchedule: makeEntityAPI('EmployeeSchedule'),
  Expense: makeEntityAPI('Expense'),
  MpesaPayment: makeEntityAPI('MpesaPayment'),
  Product: makeEntityAPI('Product'),
  Promotion: makeEntityAPI('Promotion'),
  PurchaseOrder: makeEntityAPI('PurchaseOrder'),
  Sale: makeEntityAPI('Sale'),
  Shift: makeEntityAPI('Shift'),
  ShiftAudit: makeEntityAPI('ShiftAudit'),
  Supplier: makeEntityAPI('Supplier'),
  User: makeEntityAPI('users'),
};


// ── Auth Endpoints ───────────────────────────────────────

const auth = {
  me: async () => {
    return request('/auth/me');
  },

  loginViaEmailPassword: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store the token returned by the backend
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('dukapos_access_token', data.token);
    }

    return data;
  },

  register: async ({ email, password }) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  verifyOtp: async ({ email, otpCode }) => {
    const data = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    });

    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('dukapos_access_token', data.access_token);
    }

    return data;
  },

  resendOtp: async (email) => {
    return request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('dukapos_access_token', token);
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('dukapos_access_token');
    window.location.href = '/login';
  },

  redirectToLogin: () => {
    window.location.href = '/login';
  },

  googleLogin: async (credential) => {
    const data = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('dukapos_access_token', data.token);
    }
    return data;
  },

  loginWithProvider: async (provider, redirectUrl) => {
    // Kept for legacy calls — Google now handled via googleLogin()
    console.warn('Use googleLogin() for Google OAuth');
  },

  resetPasswordRequest: async (email) => {
    return { success: true };
  },

  resetPassword: async ({ resetToken, newPassword }) => {
    return { success: true };
  },
};


// ── Server-side Function Invocation ──────────────────────

const functions = {
  invoke: async (name, payload) => {
    // PDF generation functions return binary data
    const pdfFunctions = [
      'generateHardwarePDF',
      'generateBrandingPDF',
      'generateUserManualPDF',
      'generateDukaPOSPDF',
      'generateEtimsRoadmapPDF',
      'generateReceiptPDF',
    ];

    if (pdfFunctions.includes(name)) {
      return request('/functions/invoke', {
        method: 'POST',
        body: JSON.stringify({ name, payload }),
        responseType: 'arraybuffer',
      });
    }

    return request('/functions/invoke', {
      method: 'POST',
      body: JSON.stringify({ name, payload }),
    });
  },
};


// ── Export ────────────────────────────────────────────────

export const api = {
  auth,
  entities,
  functions,
};
