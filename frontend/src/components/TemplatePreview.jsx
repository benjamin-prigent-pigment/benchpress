import React, { useState, useEffect } from 'react';
import { IoRefresh } from 'react-icons/io5';
import { generateRandomPreview } from '../utils/templateUtils';
import IconGreyButton from './buttons/IconGreyButton';
import './TemplatePreview.css';

/**
 * TemplatePreview component - displays a random preview of the template
 */
function TemplatePreview({ template, text, componentsMap, variantScopes = [] }) {
  const [previewText, setPreviewText] = useState('');

  // Generate preview when text, componentsMap, or variantScopes changes
  useEffect(() => {
    if (text && componentsMap && Object.keys(componentsMap).length > 0) {
      const preview = generateRandomPreview(text, componentsMap, variantScopes);
      setPreviewText(preview);
    } else {
      setPreviewText('');
    }
  }, [text, componentsMap, variantScopes]);

  const handleReload = () => {
    if (text && componentsMap && Object.keys(componentsMap).length > 0) {
      const preview = generateRandomPreview(text, componentsMap, variantScopes);
      setPreviewText(preview);
    }
  };

  return (
    <div className="template-preview">
      <div className="template-preview-header">
        <h3>Preview</h3>
        <IconGreyButton
          icon={<IoRefresh size={20} />}
          onClick={handleReload}
          ariaLabel="Generate a new random preview"
          title="Generate a new random preview"
        />
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

