// API utility functions for results management

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {},
    ...options,
  };

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
  }

  try {
    console.log('[resultsAPI] Making request:', { method: config.method || 'GET', url });
    const response = await fetch(url, config);
    console.log('[resultsAPI] Response status:', response.status, response.statusText);
    const data = await response.json();
    console.log('[resultsAPI] Response data:', data);
    
    if (!response.ok) {
      const errorMessage = data.error || `API error: ${response.status} ${response.statusText}`;
      console.error('[resultsAPI] Request failed:', errorMessage);
      const error = new Error(errorMessage);
      // Preserve error details if present
      if (data.details) {
        error.details = data.details;
      }
      throw error;
    }
    
    console.log('[resultsAPI] Request successful');
    return data;
  } catch (error) {
    console.error('[resultsAPI] API call failed:', error);
    throw error;
  }
}

// Results API
export const resultsAPI = {
  /**
   * Upload a new result CSV file
   * @param {File} file - The CSV file to upload
   * @param {number} templateId - The template ID to associate with this result
   * @returns {Promise<Object>} Result metadata with id, filename, template_id, upload_date, status
   */
  uploadResult: (file, templateId) => {
    if (!file) {
      return Promise.reject(new Error('No file provided'));
    }
    if (!templateId) {
      return Promise.reject(new Error('templateId is required'));
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', templateId.toString());

    return apiCall('/results/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Get all uploaded results
   * @returns {Promise<Array>} List of result metadata objects
   */
  getAllResults: () => apiCall('/results'),

  /**
   * Get a single result with computed KPIs
   * @param {number} resultId - The result ID
   * @returns {Promise<Object>} Full result object with KPIs
   */
  getResult: (resultId) => {
    if (!resultId || resultId === 'undefined') {
      return Promise.reject(new Error('Invalid result ID'));
    }
    return apiCall(`/results/${resultId}`);
  },

  /**
   * Compare two results
   * @param {number} resultId1 - First result ID
   * @param {number} resultId2 - Second result ID
   * @returns {Promise<Object>} Comparison object with both results and differences
   */
  compareResults: (resultId1, resultId2) => {
    if (!resultId1 || resultId1 === 'undefined') {
      return Promise.reject(new Error('Invalid result ID 1'));
    }
    if (!resultId2 || resultId2 === 'undefined') {
      return Promise.reject(new Error('Invalid result ID 2'));
    }
    return apiCall(`/results/${resultId1}/compare/${resultId2}`);
  },

  /**
   * Delete a result
   * @param {number} resultId - The result ID to delete
   * @returns {Promise<Object>} Success message
   */
  deleteResult: (resultId) => {
    if (!resultId || resultId === 'undefined') {
      return Promise.reject(new Error('Invalid result ID'));
    }
    return apiCall(`/results/${resultId}`, {
      method: 'DELETE',
    });
  },
};

