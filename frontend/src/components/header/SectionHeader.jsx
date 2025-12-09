import './SectionHeader.css';

function SectionHeader({ 
  title, 
  label,
  children,
  className = '' 
}) {
  return (
    <div className={`section-header ${className}`}>
      <div className="section-header-content">
        <h3>{title}</h3>
        {label && (
          <div className="section-header-label">{label}</div>
        )}
      </div>
      {children && (
        <div className="section-header-actions">
          {children}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;

