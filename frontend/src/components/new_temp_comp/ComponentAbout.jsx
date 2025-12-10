import { useState, useEffect } from 'react';
import TextInput from '../input/TextInput';
import TextDescriptionInput from '../input/TextDescriptionInput';
import IconGreyButton from '../buttons/IconGreyButton';
import IconPrimaryButton from '../buttons/IconPrimaryButton';
import { IoPencil, IoCheckmark, IoClose } from 'react-icons/io5';
import './ComponentAbout.css';

function ComponentAbout({ name, description, onSave, onError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name || '');
  const [editDescription, setEditDescription] = useState(description || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditName(name || '');
    setEditDescription(description || '');
  }, [name, description]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditName(name || '');
    setEditDescription(description || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(name || '');
    setEditDescription(description || '');
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      if (onError) onError('Component name is required');
      return;
    }

    try {
      setSaving(true);
      await onSave(editName.trim(), editDescription.trim());
      setIsEditing(false);
      if (onError) onError(null);
    } catch (err) {
      if (onError) onError(err.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="component-about">
      <div className="component-about-header">
        <h3 className="component-about-title">About this component</h3>
        {isEditing ? (
          <div className="component-about-actions">
            <IconGreyButton
              icon={<IoClose size={18} />}
              onClick={handleCancel}
              disabled={saving}
              ariaLabel="Cancel editing"
              title="Cancel editing"
            />
            <IconPrimaryButton
              icon={<IoCheckmark size={18} />}
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              ariaLabel="Save component"
              title={saving ? 'Saving...' : 'Save component'}
            />
          </div>
        ) : (
          <IconGreyButton
            icon={<IoPencil size={18} />}
            onClick={handleStartEdit}
            ariaLabel="Edit component name and description"
            title="Edit component name and description"
          />
        )}
      </div>

      <div className="component-about-content">
        {isEditing ? (
          <div className="component-about-edit">
            <TextInput
              label="Component name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Placeholder"
              required
            />
            <TextDescriptionInput
              label="Component description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Placeholder"
              rows={3}
            />
          </div>
        ) : (
          <div className="component-about-display">
            <div className="component-about-field">
              <label className="component-about-label">Component name</label>
              <div className="component-about-value">{name || '—'}</div>
            </div>
            <div className="component-about-field">
              <label className="component-about-label">Component description</label>
              <div className="component-about-value">{description || '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentAbout;

