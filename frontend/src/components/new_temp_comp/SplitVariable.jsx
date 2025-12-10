import { useState, useEffect } from 'react';
import IconGreyButton from '../buttons/IconGreyButton';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';
import { IoPencil } from 'react-icons/io5';
import './SplitVariable.css';

function SplitVariable({
  variable,
  splitParts = [],
  onSave,
  onDelete,
  canDelete = true,
  disabled = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    if (variable && typeof variable === 'object') {
      setEditValues({ ...variable });
    } else {
      // Initialize with empty values for each part
      const initialValues = {};
      splitParts.forEach(part => {
        initialValues[part] = '';
      });
      setEditValues(initialValues);
    }
  }, [variable, splitParts]);

  // If variable is null/undefined/empty, start in edit mode (for new variables)
  useEffect(() => {
    if (!variable || (typeof variable === 'object' && Object.keys(variable).length === 0)) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [variable]);

  const handleStartEdit = () => {
    setIsEditing(true);
    if (variable && typeof variable === 'object') {
      setEditValues({ ...variable });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (variable && typeof variable === 'object') {
      setEditValues({ ...variable });
    } else {
      // If it's a new variable, call onDelete to cancel
      onDelete?.();
    }
  };

  const handleSave = () => {
    // Validate all parts are filled
    if (!splitParts.every(part => editValues[part]?.trim())) {
      return;
    }
    const trimmedValues = {};
    splitParts.forEach(part => {
      trimmedValues[part] = editValues[part]?.trim() || '';
    });
    onSave?.(trimmedValues);
    setIsEditing(false);
  };

  const handlePartChange = (part, value) => {
    setEditValues({
      ...editValues,
      [part]: value
    });
  };

  if (isEditing) {
    return (
      <div className="split-variable editing">
        <div className="split-variable-edit-form">
          {splitParts.map(part => (
            <div key={part} className="split-variable-edit-part">
              <label className="split-variable-part-label">
                <strong>{part}:</strong>
              </label>
              <textarea
                value={editValues[part] || ''}
                onChange={(e) => handlePartChange(part, e.target.value)}
                placeholder={`Enter ${part} value`}
                className="split-variable-input"
                rows={3}
                disabled={disabled}
              />
            </div>
          ))}
          <div className="split-variable-edit-actions">
            <PrimaryButton
              onClick={handleSave}
              disabled={!splitParts.every(part => editValues[part]?.trim()) || disabled}
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
      </div>
    );
  }

  return (
    <div className="split-variable saved">
      <div className="split-variable-content">
        <div className="split-variable-parts">
          {splitParts.map(part => (
            <div key={part} className="split-variable-part">
              <span className="split-variable-part-label">{part}:</span>
              <span className="split-variable-part-value">
                {variable?.[part] || '—'}
              </span>
            </div>
          ))}
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
        <div className="split-variable-delete">
          <button
            type="button"
            onClick={() => onDelete?.()}
            disabled={disabled}
            className="split-variable-delete-btn"
            aria-label="Delete variable"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default SplitVariable;

