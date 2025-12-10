import { useNavigate } from 'react-router-dom';
import IconGreyButton from '../buttons/IconGreyButton';
import IconDestructionButton from '../buttons/IconDestructionButton';
import './SecondaryPageHeader.css';

function SecondaryPageHeader({ 
  title, 
  backPath, 
  backLabel, 
  onDelete, 
  deleteLabel,
  deleteDisabled = false,
  onEdit,
  editLabel,
  editDisabled = false,
  className = '' 
}) {
  const navigate = useNavigate();
  
  const defaultDeleteLabel = deleteLabel || `Delete ${backPath === '/templates' ? 'Template' : 'Component'}`;
  const defaultEditLabel = editLabel || `Edit ${backPath === '/templates' ? 'Template' : 'Component'}`;

  return (
    <div className={`secondary-page-header ${className}`}>
      <div className="header-left">
        <IconGreyButton
          icon={
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12.5 15L7.5 10L12.5 5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={() => navigate(backPath)}
          ariaLabel={backLabel || `Back to ${backPath === '/templates' ? 'Templates' : 'Components'}`}
          title={backLabel || `Back to ${backPath === '/templates' ? 'Templates' : 'Components'}`}
        />
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {onEdit && (
          <IconGreyButton
            icon={
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M11.05 3.00002L4.20835 10.2417C3.95002 10.5167 3.70002 11.0584 3.65002 11.4334L3.34169 14.1334C3.23335 15.1084 3.93335 15.775 4.90002 15.6084L7.58335 15.15C7.95835 15.0834 8.48335 14.8084 8.74169 14.525L15.5834 7.28335C16.7667 6.03335 17.3 4.60835 15.4584 2.86668C13.625 1.14168 12.2334 1.75002 11.05 3.00002Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeMiterlimit="10" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M9.90833 4.20831C10.2667 6.00831 11.7 7.31665 13.5167 7.49998M2.5 18.3333H17.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeMiterlimit="10" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            }
            onClick={onEdit}
            disabled={editDisabled}
            ariaLabel={defaultEditLabel}
            title={defaultEditLabel}
          />
        )}
        {onDelete && (
          <IconDestructionButton
            icon={
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M2.5 5H4.16667H17.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M6.66667 5V3.33333C6.66667 2.89131 6.84226 2.46738 7.15482 2.15482C7.46738 1.84226 7.89131 1.66667 8.33333 1.66667H11.6667C12.1087 1.66667 12.5326 1.84226 12.8452 2.15482C13.1577 2.46738 13.3333 2.89131 13.3333 3.33333V5M15.8333 5V16.6667C15.8333 17.1087 15.6577 17.5326 15.3452 17.8452C15.0326 18.1577 14.6087 18.3333 14.1667 18.3333H5.83333C5.39131 18.3333 4.96738 18.1577 4.65482 17.8452C4.34226 17.5326 4.16667 17.1087 4.16667 16.6667V5H15.8333Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M8.33333 9.16667V14.1667" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M11.6667 9.16667V14.1667" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            }
            onClick={onDelete}
            disabled={deleteDisabled}
            ariaLabel={defaultDeleteLabel}
            title={defaultDeleteLabel}
          />
        )}
      </div>
    </div>
  );
}

export default SecondaryPageHeader;

