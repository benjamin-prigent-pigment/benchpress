import { useState, useEffect } from 'react';
import IconGreyButton from '../buttons/IconGreyButton';
import IconPrimaryButton from '../buttons/IconPrimaryButton';
import IconDestructionButton from '../buttons/IconDestructionButton';
import { IoTrash, IoPencil, IoCheckmark, IoClose } from 'react-icons/io5';
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
    if (variable && typeof variable === 'object') {
      setIsEditing(false);
      setEditValues({ ...variable });
    } else {
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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this variable? This action cannot be undone.')) {
      onDelete?.();
    }
  };

  const handlePartChange = (part, value) => {
    setEditValues({
      ...editValues,
      [part]: value
    });
  };

  if (isEditing) {
    const lastPartIndex = splitParts.length - 1;
    return (
      <div className="split-variable editing">
        <div className="split-variable-edit-form">
          <div className="split-variable-edit-parts">
            {splitParts.map((part, index) => (
              <div key={part} className={`split-variable-edit-part ${index === lastPartIndex ? 'split-variable-edit-part-last' : ''}`}>
                <label className="split-variable-part-label">
                  <strong>{part}:</strong>
                </label>
                <div className="split-variable-input-wrapper">
                  <textarea
                    value={editValues[part] || ''}
                    onChange={(e) => handlePartChange(part, e.target.value)}
                    placeholder={`Enter ${part} value`}
                    className="split-variable-input"
                    rows={3}
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="split-variable-edit-actions">
            <IconGreyButton
              icon={<IoClose size={18} />}
              onClick={handleCancel}
              disabled={disabled}
              ariaLabel="Cancel editing"
              title="Cancel editing"
            />
            <IconPrimaryButton
              icon={<IoCheckmark size={18} />}
              onClick={handleSave}
              disabled={!splitParts.every(part => editValues[part]?.trim()) || disabled}
              ariaLabel="Save variable"
              title="Save variable"
            />
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
        {canDelete && (
          <IconDestructionButton
            icon={<IoTrash size={18} />}
            onClick={handleDelete}
            disabled={disabled}
            ariaLabel="Delete variable"
            title="Delete variable"
          />
        )}
      </div>
      
    </div>
  );
}

export default SplitVariable;

