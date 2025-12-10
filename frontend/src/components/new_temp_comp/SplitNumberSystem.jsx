import { useState, useEffect } from 'react';
import IconGreyButton from '../buttons/IconGreyButton';
import IconPrimaryButton from '../buttons/IconPrimaryButton'; 
import TextInput from '../input/TextInput';
import { IoPencil, IoCheckmark, IoClose } from 'react-icons/io5';
import './SplitNumberSystem.css';

function SplitNumberSystem({
  splitParts = [],
  onSplitPartsChange,
  onError,
  disabled = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSplitParts, setEditSplitParts] = useState([...splitParts]);
  const [numberOfSplits, setNumberOfSplits] = useState(splitParts.length);

  useEffect(() => {
    setEditSplitParts([...splitParts]);
    setNumberOfSplits(splitParts.length);
  }, [splitParts]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditSplitParts([...splitParts]);
    setNumberOfSplits(splitParts.length);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditSplitParts([...splitParts]);
    setNumberOfSplits(splitParts.length);
  };

  const handleNumberOfSplitsChange = (e) => {
    const num = parseInt(e.target.value, 10);
    if (num >= 2) {
      setNumberOfSplits(num);
      const newParts = [];
      const oldParts = editSplitParts;
      for (let i = 0; i < num; i++) {
        if (i < oldParts.length) {
          newParts.push(oldParts[i]);
        } else {
          // Generate default names: A, B, C, D, etc.
          newParts.push(String.fromCharCode(65 + i)); // 65 is 'A'
        }
      }
      setEditSplitParts(newParts);
    }
  };

  const handlePartNameChange = (index, newName) => {
    const updated = [...editSplitParts];
    updated[index] = newName;
    setEditSplitParts(updated);
  };

  const handleSave = () => {
    // Validate all parts are non-empty
    const trimmedParts = editSplitParts.map(part => part.trim());
    if (trimmedParts.some(part => !part)) {
      if (onError) onError('All split part names must be non-empty');
      return;
    }
    // Validate unique part names
    if (trimmedParts.length !== new Set(trimmedParts).size) {
      if (onError) onError('Split part names must be unique');
      return;
    }
    onSplitPartsChange(trimmedParts);
    setIsEditing(false);
    if (onError) onError(null);
  };

  if (isEditing) {
    return (
      <div className="split-number-system editing">
        <div className="split-number-system-edit">
          <TextInput
            label="Number of Splits"
            helpText="Splits enable you to split variables inside a template, minimum 2 splits required"
            type="number"
            value={numberOfSplits}
            onChange={handleNumberOfSplitsChange}
            min="2"
            required
          />
          <div className="split-parts-edit-inputs">
            {editSplitParts.map((part, index) => (
              <TextInput
                key={index}
                label={`Split ${index + 1} Name`}
                value={part}
                onChange={(e) => handlePartNameChange(index, e.target.value)}
                placeholder={`e.g., ${String.fromCharCode(65 + index)}`}
                required
              />
            ))}
          </div>
        </div>
        <div className="split-number-system-actions">
            <IconGreyButton
              icon={<IoClose size={18} />}
              onClick={handleCancel}
              disabled={disabled}
              ariaLabel="Cancel splits"
              title="Cancel splits"
            />
            <IconPrimaryButton
              icon={<IoCheckmark size={18} />}
              onClick={handleSave}
              disabled={disabled}
              ariaLabel="Save splits"
              title="Save splits"
            />
          </div>
      </div>
    );
  }

  return (
    <div className="split-number-system display">
      <div className="split-number-system-content">
        <div className="split-number-system-parts-wrapper">
          <span className="split-number-system-label">Splits:</span>
          <span className="split-number-system-parts">
            {splitParts.length > 0 ? splitParts.join(', ') : '—'}
          </span>
        </div>
        <IconGreyButton
          icon={<IoPencil size={18} />}
          onClick={handleStartEdit}
          ariaLabel="Edit splits"
          title="Edit splits"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default SplitNumberSystem;

