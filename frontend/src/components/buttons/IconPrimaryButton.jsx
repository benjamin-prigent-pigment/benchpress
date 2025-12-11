import './IconPrimaryButton.css';

function IconPrimaryButton({ 
  icon,
  onClick, 
  ariaLabel,
  title,
  disabled = false,
  className = '' 
}) {
  return (
    <button 
      type="button"
      className={`btn-icon-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title || ariaLabel}
    >
      {icon}
    </button>
  );
}

export default IconPrimaryButton;

