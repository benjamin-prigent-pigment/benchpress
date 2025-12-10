import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateAPI } from '../utils/api';

/**
 * Custom hook for template operations
 */
export const useTemplate = (templateId) => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [text, setText] = useState('');
  const [permutationCount, setPermutationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load template
  const loadTemplate = async () => {
    console.log('[useTemplate] loadTemplate called with id:', templateId);
    if (!templateId || templateId === 'undefined') {
      console.error('[useTemplate] loadTemplate: Invalid template ID');
      setError('Invalid template ID');
      setLoading(false);
      return;
    }
    
    try {
      console.log('[useTemplate] Starting to load template...');
      setLoading(true);
      const data = await templateAPI.getById(templateId);
      console.log('[useTemplate] Template loaded successfully:', data);
      setTemplate(data);
      setText(data.text || '');
      console.log('[useTemplate] State updated:', { 
        name: data.name, 
        textLength: (data.text || '').length 
      });
      setError(null);
    } catch (err) {
      console.error('[useTemplate] Failed to load template:', err);
      console.error('[useTemplate] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError('Failed to load template');
      console.error(err);
    } finally {
      setLoading(false);
      console.log('[useTemplate] loadTemplate finished');
    }
  };

  // Update permutation count
  const updatePermutationCount = async () => {
    console.log('[useTemplate] updatePermutationCount called for id:', templateId);
    try {
      const countData = await templateAPI.getCount(templateId);
      console.log('[useTemplate] Permutation count received:', countData);
      setPermutationCount(countData.count || 0);
    } catch (err) {
      console.error('[useTemplate] Failed to get permutation count:', err);
      console.error('[useTemplate] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setPermutationCount(0);
    }
  };

  // Save template
  const saveTemplate = async () => {
    console.log('[useTemplate] saveTemplate called', { templateId, textLength: text.length });
    try {
      console.log('[useTemplate] Starting save operation...');
      setSaving(true);
      console.log('[useTemplate] Updating template via PUT /api/templates/' + templateId);
      console.log('[useTemplate] Request payload:', JSON.stringify({ text }, null, 2));
      await templateAPI.update(templateId, { text });
      console.log('[useTemplate] Template updated successfully');
      setError(null);
      // Refresh the permutation count after successful save
      await updatePermutationCount();
    } catch (err) {
      console.error('[useTemplate] Save operation failed:', err);
      console.error('[useTemplate] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError('Failed to save template');
      console.error(err);
    } finally {
      setSaving(false);
      console.log('[useTemplate] saveTemplate finished');
    }
  };

  // Generate CSV
  const generateCSV = async () => {
    console.log('[useTemplate] generateCSV called for id:', templateId);
    try {
      console.log('[useTemplate] Generating CSV via POST /api/templates/' + templateId + '/generate');
      await templateAPI.generate(templateId);
      console.log('[useTemplate] CSV generated and downloaded successfully');
    } catch (err) {
      console.error('[useTemplate] Failed to generate CSV:', err);
      console.error('[useTemplate] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError('Failed to generate CSV');
      console.error(err);
    }
  };

  // Update template metadata (name and description)
  const updateTemplateMetadata = async (name, description) => {
    console.log('[useTemplate] updateTemplateMetadata called', { templateId, name, description });
    try {
      console.log('[useTemplate] Starting metadata update...');
      setSaving(true);
      console.log('[useTemplate] Updating template metadata via PUT /api/templates/' + templateId);
      const updatedTemplate = await templateAPI.update(templateId, { name, description });
      console.log('[useTemplate] Template metadata updated successfully');
      setTemplate(updatedTemplate);
      setError(null);
    } catch (err) {
      console.error('[useTemplate] Metadata update failed:', err);
      console.error('[useTemplate] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError('Failed to update template metadata');
      console.error(err);
      throw err;
    } finally {
      setSaving(false);
      console.log('[useTemplate] updateTemplateMetadata finished');
    }
  };

  // Delete template
  const deleteTemplate = async () => {
    console.log('[useTemplate] deleteTemplate called for id:', templateId);
    if (!window.confirm('Are you sure you want to delete this template?')) {
      console.log('[useTemplate] Delete cancelled by user');
      return;
    }

    try {
      console.log('[useTemplate] Deleting template via DELETE /api/templates/' + templateId);
      await templateAPI.delete(templateId);
      console.log('[useTemplate] Template deleted successfully, navigating to /templates');
      navigate('/templates');
    } catch (err) {
      console.error('[useTemplate] Failed to delete template:', err);
      console.error('[useTemplate] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setError(err.message || 'Failed to delete template');
      console.error(err);
    }
  };

  // Load template on mount
  useEffect(() => {
    console.log('[useTemplate] useEffect triggered', { templateId });
    if (!templateId || templateId === 'undefined') {
      console.error('[useTemplate] Invalid template ID:', templateId);
      setError('Invalid template ID');
      setLoading(false);
      return;
    }
    loadTemplate();
  }, [templateId]);

  // Update permutation count when text or template changes
  useEffect(() => {
    if (template && text) {
      console.log('[useTemplate] Template and text available, updating permutation count');
      updatePermutationCount();
    }
  }, [text, template]);

  return {
    template,
    text,
    setText,
    permutationCount,
    loading,
    saving,
    error,
    setError,
    saveTemplate,
    generateCSV,
    deleteTemplate,
    updateTemplateMetadata,
    updatePermutationCount
  };
};

