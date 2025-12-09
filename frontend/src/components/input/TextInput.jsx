import './TextInput.css';

function TextInput({ 
  label,
  helpText,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  className = ''
}) {
  const inputId = id || name || `text-input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`text-input-wrapper ${className}`}>
      <label htmlFor={inputId} className="text-input-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`text-input ${error ? 'text-input-error' : ''}`}
      />
      {helpText && !error && (
        <div className="text-input-help">
          {helpText}
        </div>
      )}
      {error && (
        <div className="text-input-error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default TextInput;

