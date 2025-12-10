import React from 'react';
import './TemplatePreview.css';

/**
 * TemplatePreview component - displays a random preview of the template
 */
function TemplatePreview({ template, text }) {
  return (
    <div className="template-preview">
      <div className="template-preview-header">
        <h3>Template Preview</h3>
      </div>
      <div className="template-preview-content">
        {/* Preview content will be added here */}
      </div>
    </div>
  );
}

export default TemplatePreview;

