// API utility functions for communicating with the backend

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust port as needed

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log('[API] ===== Making request =====');
    console.log('[API] Method:', config.method || 'GET');
    console.log('[API] URL:', url);
    if (config.body) {
      const bodyObj = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
      console.log('[API] Request body:', bodyObj);
      if (bodyObj.variants) {
        console.log('[API] Request variants count:', bodyObj.variants.length);
        if (bodyObj.variants.length > 0) {
          console.log('[API] Last variant in request:', bodyObj.variants[bodyObj.variants.length - 1]);
        }
      }
    }
    const response = await fetch(url, config);
    console.log('[API] Response status:', response.status, response.statusText);
    const data = await response.json();
    console.log('[API] Response data:', data);
    if (data.variants) {
      console.log('[API] Response variants count:', data.variants.length);
      if (data.variants.length > 0) {
        console.log('[API] Last variant in response:', data.variants[data.variants.length - 1]);
      }
    }
    if (!response.ok) {
      const errorMessage = data.error || `API error: ${response.status} ${response.statusText}`;
      console.error('[API] ❌ Request failed:', errorMessage);
      throw new Error(errorMessage);
    }
    console.log('[API] ✅ Request successful');
    console.log('[API] ===== Request complete =====');
    return data;
  } catch (error) {
    console.error('[API] ❌ API call failed:', error);
    console.error('[API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

// Component API
export const componentAPI = {
  getAll: () => apiCall('/components'),
  getById: (id) => {
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid component ID'));
    }
    return apiCall(`/components/${id}`);
  },
  create: (data) => {
    console.log('[componentAPI.create] Called with data:', data);
    return apiCall('/components', { method: 'POST', body: data });
  },
  update: (id, data) => {
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid component ID'));
    }
    return apiCall(`/components/${id}`, { method: 'PUT', body: data });
  },
  delete: (id) => {
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid component ID'));
    }
    return apiCall(`/components/${id}`, { method: 'DELETE' });
  },
  
  // Variant management
  addVariant: (componentId, variant) => 
    apiCall(`/components/${componentId}/variants`, { method: 'POST', body: { variant } }),
  updateVariant: (componentId, variantId, variant) => 
    apiCall(`/components/${componentId}/variants/${variantId}`, { method: 'PUT', body: { variant } }),
  deleteVariant: (componentId, variantId) => 
    apiCall(`/components/${componentId}/variants/${variantId}`, { method: 'DELETE' }),
};

// Template API
export const templateAPI = {
  getAll: () => apiCall('/templates'),
  getById: (id) => {
    console.log('[templateAPI.getById] Called with id:', id);
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    return apiCall(`/templates/${id}`);
  },
  create: (data) => {
    console.log('[templateAPI.create] Called with data:', data);
    return apiCall('/templates', { method: 'POST', body: data });
  },
  update: (id, data) => {
    console.log('[templateAPI.update] Called with id:', id, 'data:', data);
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    return apiCall(`/templates/${id}`, { method: 'PUT', body: data });
  },
  delete: (id) => {
    console.log('[templateAPI.delete] Called with id:', id);
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    return apiCall(`/templates/${id}`, { method: 'DELETE' });
  },
  
  // Permutation and export
  getCount: (id) => {
    console.log('[templateAPI.getCount] Called with id:', id);
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    return apiCall(`/templates/${id}/count`);
  },
  generate: (id) => {
    console.log('[templateAPI.generate] Called with id:', id);
    if (!id || id === 'undefined') {
      return Promise.reject(new Error('Invalid template ID'));
    }
    const url = `${API_BASE_URL}/templates/${id}/generate`;
    console.log('[templateAPI.generate] Making request to:', url);
    return fetch(url, { method: 'POST' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Export failed: ${response.status} ${response.statusText}`);
        }
        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        console.log('[templateAPI.generate] Content-Disposition header:', contentDisposition);
        
        let filename = `permutation_${id}.csv`; // fallback
        if (contentDisposition) {
          // Try multiple patterns to extract filename
          // Pattern 1: filename="filename.csv" or filename='filename.csv'
          let filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          } else {
            // Pattern 2: filename*=UTF-8''filename.csv (RFC 5987)
            filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = decodeURIComponent(filenameMatch[1]);
            } else {
              // Pattern 3: filename=filename.csv (without quotes)
              filenameMatch = contentDisposition.match(/filename=([^;\n]+)/);
              if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].trim();
              }
            }
          }
        }
        console.log('[templateAPI.generate] Extracted filename:', filename);
        return response.blob().then(blob => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
  },
};

