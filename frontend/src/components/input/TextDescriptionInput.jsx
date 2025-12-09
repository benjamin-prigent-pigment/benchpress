import './TextDescriptionInput.css';

function TextDescriptionInput({ 
  label,
  helpText,
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  rows = 3,
  className = ''
}) {
  const inputId = id || name || `text-description-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`text-description-input-wrapper ${className}`}>
      <label htmlFor={inputId} className="text-description-input-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`text-description-input ${error ? 'text-description-input-error' : ''}`}
      />
      {helpText && !error && (
        <div className="text-description-input-help">
          {helpText}
        </div>
      )}
      {error && (
        <div className="text-description-input-error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default TextDescriptionInput;

