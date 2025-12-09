import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateAPI } from '../utils/api';
import { useResultUpload } from '../hooks/useResultUpload';
import './ResultUploadModal.css';

function ResultUploadModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { upload, uploading, error, success, reset } = useResultUpload();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      reset();
      setSelectedTemplateId('');
      setSelectedFile(null);
      setFileName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen, reset is stable

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await templateAPI.getAll();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      return;
    }

    if (!selectedTemplateId) {
      return;
    }

    const result = await upload(selectedFile, parseInt(selectedTemplateId));
    
    if (result) {
      // Close modal and navigate to result item page
      onClose();
      navigate(`/results/${result.id}`);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTemplateId('');
    setSelectedFile(null);
    setFileName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload a new test</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="template-select">Template</label>
            {loadingTemplates ? (
              <div className="loading-text">Loading templates...</div>
            ) : (
              <select
                id="template-select"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                required
                disabled={uploading}
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="file-input">CSV File</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file-input"
                accept=".csv"
                onChange={handleFileChange}
                required
                disabled={uploading}
              />
              {fileName && (
                <div className="file-name">{fileName}</div>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || !selectedFile || !selectedTemplateId}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResultUploadModal;

