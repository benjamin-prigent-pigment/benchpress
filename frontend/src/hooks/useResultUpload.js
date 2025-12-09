import { useState, useCallback } from 'react';
import { resultsAPI } from '../utils/resultsAPI';

/**
 * Hook for uploading result CSV files
 * @returns {Object} { upload, uploading, error, success }
 */
export function useResultUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const upload = async (file, templateId) => {
    if (!file) {
      setError('No file selected');
      return null;
    }

    if (!templateId) {
      setError('Template ID is required');
      return null;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const result = await resultsAPI.uploadResult(file, templateId);
      
      setSuccess('Result uploaded successfully');
      return result;
    } catch (err) {
      console.error('[useResultUpload] Upload error:', err);
      let errorMessage = err.message || 'Failed to upload result';
      
      // Check if error response has details (validation errors from backend)
      // The API might return error details in the error object
      if (err.response && err.response.details) {
        const details = Array.isArray(err.response.details) 
          ? err.response.details.join(', ')
          : err.response.details;
        errorMessage = `${errorMessage}: ${details}`;
      } else if (err.details) {
        const details = Array.isArray(err.details) 
          ? err.details.join(', ')
          : err.details;
        errorMessage = `${errorMessage}: ${details}`;
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reset = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    upload,
    uploading,
    error,
    success,
    reset,
  };
}

