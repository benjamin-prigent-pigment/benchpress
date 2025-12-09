import './ToggleInput.css';

function ToggleInput({ 
  label,
  helpText,
  id,
  name,
  checked,
  onChange,
  disabled = false,
  required = false,
  error,
  className = ''
}) {
  const inputId = id || name || `toggle-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`toggle-input-wrapper ${className}`}>
      <div className="toggle-input-label-container">
        <span className="toggle-input-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </span>
        <label htmlFor={inputId} className="toggle-switch">
          <input
            id={inputId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className="toggle-input"
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      {helpText && !error && (
        <div className="toggle-input-help">
          {helpText}
        </div>
      )}
      {error && (
        <div className="toggle-input-error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default ToggleInput;

