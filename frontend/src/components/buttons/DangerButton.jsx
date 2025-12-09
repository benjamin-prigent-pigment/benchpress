import './DangerButton.css';

function DangerButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '' 
}) {
  return (
    <button 
      type={type}
      className={`btn-danger ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default DangerButton;

