import { useState, useEffect } from 'react';
import IconGreyButton from '../buttons/IconGreyButton';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';
import { IoPencil } from 'react-icons/io5';
import './NonSplitVariables.css';

function NonSplitVariables({
  value,
  onSave,
  onDelete,
  canDelete = true,
  disabled = false
}) {
  // If value is null/undefined/empty, start in edit mode (for new variables)
  const [isEditing, setIsEditing] = useState(!value || value === '');
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => {
    if (value !== null && value !== undefined && value !== '') {
      setEditValue(value);
      setIsEditing(false);
    } else {
      setEditValue('');
      setIsEditing(true);
    }
  }, [value]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(value || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value || '');
  };

  const handleSave = () => {
    if (editValue && editValue.trim()) {
      onSave?.(editValue.trim());
      setIsEditing(false);
    } else {
      // If empty and it's a new variable, call onDelete to cancel
      if (!value || value === '') {
        onDelete?.();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="non-split-variable editing">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter variable value"
          className="non-split-variable-input"
          autoFocus
          disabled={disabled}
          rows={4}
        />
        <div className="non-split-variable-actions">
          <PrimaryButton
            onClick={handleSave}
            disabled={!editValue || !editValue.trim() || disabled}
            className="btn-small"
          >
            Save
          </PrimaryButton>
          <SecondaryButton
            onClick={handleCancel}
            disabled={disabled}
            className="btn-small"
          >
            Cancel
          </SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="non-split-variable saved">
      <div className="non-split-variable-content">
        <div className="non-split-variable-text">
          {value || '—'}
        </div>
        <IconGreyButton
          icon={<IoPencil size={18} />}
          onClick={handleStartEdit}
          ariaLabel="Edit variable"
          title="Edit variable"
          disabled={disabled}
        />
      </div>
      {canDelete && (
        <div className="non-split-variable-delete">
          <button
            type="button"
            onClick={() => onDelete?.()}
            disabled={disabled}
            className="non-split-variable-delete-btn"
            aria-label="Delete variable"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default NonSplitVariables;

