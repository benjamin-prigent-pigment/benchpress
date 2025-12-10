import React, { useState, useEffect } from 'react';
import { generateRandomPreview } from '../utils/templateUtils';
import './TemplatePreview.css';

/**
 * TemplatePreview component - displays a random preview of the template
 */
function TemplatePreview({ template, text, componentsMap }) {
  const [previewText, setPreviewText] = useState('');

  // Generate preview when text or componentsMap changes
  useEffect(() => {
    if (text && componentsMap && Object.keys(componentsMap).length > 0) {
      const preview = generateRandomPreview(text, componentsMap);
      setPreviewText(preview);
    } else {
      setPreviewText('');
    }
  }, [text, componentsMap]);

  const handleReload = () => {
    if (text && componentsMap && Object.keys(componentsMap).length > 0) {
      const preview = generateRandomPreview(text, componentsMap);
      setPreviewText(preview);
    }
  };

  return (
    <div className="template-preview">
      <div className="template-preview-header">
        <h3>Template Preview</h3>
        <button 
          className="template-preview-reload-btn"
          onClick={handleReload}
          title="Generate a new random preview"
        >
          ↻ Reload
        </button>
      </div>
      <div className="template-preview-content">
        {previewText ? (
          <pre className="template-preview-text">{previewText}</pre>
        ) : (
          <div className="template-preview-empty">
            {text ? 'No components found in template' : 'No template text available'}
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplatePreview;

