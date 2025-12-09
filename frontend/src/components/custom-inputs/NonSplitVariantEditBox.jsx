import { useState, useEffect, useRef } from 'react';
import IconGreyButton from '../buttons/IconGreyButton';
import IconDestructionButton from '../buttons/IconDestructionButton';
import './NonSplitVariantEditBox.css';

function NonSplitVariantEditBox({
  value,
  onChange,
  onSave,
  onEdit,
  onDelete,
  canDelete = true,
  placeholder = 'Enter variant',
  disabled = false
}) {
  const isEditing = value === null || value === undefined;
  const [editingValue, setEditingValue] = useState('');
  const previousValueRef = useRef(value);

  // Track the previous non-null value and sync editingValue when entering edit mode
  useEffect(() => {
    if (value !== null && value !== undefined) {
      // Store the current value when it's not null
      previousValueRef.current = value;
    } else if (isEditing) {
      // When entering edit mode, initialize with the previous value (if editing existing) or empty (if new)
      setEditingValue(previousValueRef.current || '');
    }
  }, [isEditing, value]);

  const handleSave = () => {
    if (editingValue && editingValue.trim()) {
      onSave?.(editingValue.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="variant-edit-box editing">
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="variant-input"
          autoFocus
          disabled={disabled}
        />
        <IconGreyButton
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.66667 2.66667H10.6667L13.3333 5.33333V13.3333C13.3333 13.687 13.1928 14.0261 12.9428 14.2761C12.6927 14.5262 12.3536 14.6667 12 14.6667H4C3.64638 14.6667 3.30724 14.5262 3.05719 14.2761C2.80714 14.0261 2.66667 13.687 2.66667 13.3333V2.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.6667 2.66667V5.33333H13.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.66667 8.66667H9.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          onClick={handleSave}
          ariaLabel="Save"
          disabled={!editingValue || !editingValue.trim() || disabled}
        />
      </div>
    );
  }

  return (
    <div className="variant-edit-box filled">
      <div className="variant-content">
        <span className="variant-text">{value}</span>
        <IconGreyButton
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.3333 2.66667L13.3333 4.66667L5.33333 12.6667H3.33333V10.6667L11.3333 2.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.33333 4.66667L11.3333 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          onClick={() => onEdit?.()}
          ariaLabel="Edit"
          disabled={disabled}
          className="variant-edit-icon"
        />
      </div>
      {canDelete ? (
        <IconDestructionButton
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.66667 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          onClick={() => onDelete?.()}
          ariaLabel="Delete"
          disabled={disabled}
        />
      ) : (
        <IconGreyButton
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
              <path d="M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
              <path d="M6.66667 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
              <path d="M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
            </svg>
          }
          ariaLabel="Delete (disabled)"
          disabled={true}
          className="variant-delete-disabled"
        />
      )}
    </div>
  );
}

export default NonSplitVariantEditBox;

