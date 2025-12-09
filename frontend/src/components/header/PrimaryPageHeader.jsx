import './PrimaryPageHeader.css';

function PrimaryPageHeader({ 
  title, 
  children,
  className = '' 
}) {
  return (
    <div className={`primary-page-header ${className}`}>
      <h1>{title}</h1>
      {children && (
        <div className="header-actions">
          {children}
        </div>
      )}
    </div>
  );
}

export default PrimaryPageHeader;

