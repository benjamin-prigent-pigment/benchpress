import './SecondaryButton.css';

function SecondaryButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '' 
}) {
  return (
    <button 
      type={type}
      className={`btn-secondary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default SecondaryButton;

