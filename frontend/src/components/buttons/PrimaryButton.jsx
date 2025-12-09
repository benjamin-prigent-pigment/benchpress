import './PrimaryButton.css';

function PrimaryButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '' 
}) {
  return (
    <button 
      type={type}
      className={`btn-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;

