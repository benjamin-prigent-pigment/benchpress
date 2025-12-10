import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { componentAPI } from '../utils/api';
import PrimaryButton from './buttons/PrimaryButton';
import SecondaryButton from './buttons/SecondaryButton';
import IconGreyButton from './buttons/IconGreyButton';
import TextInput from './input/TextInput';
import TextDescriptionInput from './input/TextDescriptionInput';
import ToggleInput from './input/ToggleInput';
import NonSplitVariantEditBox from './custom-inputs/NonSplitVariantEditBox';
import SplitVariantsEditBox from './custom-inputs/SplitVariantsEditBox';
import './ComponentCreateModal.css';

function ComponentCreateModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isSplit, setIsSplit] = useState(false);
  const [splitParts, setSplitParts] = useState(['a', 'b']);
  const [numberOfSplits, setNumberOfSplits] = useState(2);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName('');
      setDescription('');
      setVariants([null]); // Start with one empty variant for editing
      setError(null);
      setIsSplit(false);
      setSplitParts(['a', 'b']);
      setNumberOfSplits(2);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Component name is required');
      return;
    }

    const validVariants = variants.filter(v => v !== null);
    if (validVariants.length < 2) {
      setError('At least 2 variants are required');
      return;
    }

    let finalSplitParts = null;

    // Validate split component structure
    if (isSplit) {
      if (!splitParts || splitParts.length < 2) {
        setError('Split component must have at least 2 parts');
        return;
      }
      // Trim and validate all part names are non-empty
      const trimmedParts = splitParts.map(part => part.trim());
      if (trimmedParts.some(part => !part)) {
        setError('All split part names must be non-empty');
        return;
      }
      // Validate unique part names (after trimming)
      if (trimmedParts.length !== new Set(trimmedParts).size) {
        setError('Split part names must be unique');
        return;
      }
      // Store trimmed parts
      finalSplitParts = trimmedParts;
      // Check all variants have all parts
      for (let i = 0; i < validVariants.length; i++) {
        const variant = validVariants[i];
        if (!variant || typeof variant !== 'object') {
          setError(`Variant ${i + 1} must be an object with all parts`);
          return;
        }
        for (const part of finalSplitParts) {
          if (!(part in variant) || variant[part].trim() === '') {
            setError(`Variant ${i + 1} missing or empty value for part "${part}"`);
            return;
          }
        }
      }
    } else {
      // Validate regular variants are strings
      for (let i = 0; i < validVariants.length; i++) {
        if (typeof validVariants[i] !== 'string') {
          setError(`Variant ${i + 1} must be a string`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      const data = { 
        name, 
        description, 
        variants: validVariants,
        isSplit,
        splitParts: finalSplitParts
      };
      
      const newComponent = await componentAPI.create(data);
      if (newComponent && newComponent.id) {
        onClose();
        navigate(`/components/${newComponent.id}`);
      } else {
        setError('Failed to create component: Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleVariantSave = (index, value) => {
    const updated = [...variants];
    updated[index] = value;
    setVariants(updated);
    setError(null);
  };

  const handleVariantEdit = (index) => {
    const updated = [...variants];
    updated[index] = null; // Set to null to trigger editing mode
    setVariants(updated);
  };

  const handleVariantDelete = (index) => {
    if (variants.filter(v => v !== null).length <= 2) {
      setError('At least 2 variants are required');
      return;
    }
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
    setError(null);
  };

  const handleVariantChange = (index, value) => {
    const updated = [...variants];
    updated[index] = value;
    setVariants(updated);
  };

  const handleAddNewVariant = () => {
    setVariants([...variants, null]); // Add null to trigger editing mode
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setVariants([]);
    setError(null);
    setIsSplit(false);
    setSplitParts(['a', 'b']);
    setNumberOfSplits(2);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content component-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Component</h2>
          <IconGreyButton
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            onClick={handleClose}
            ariaLabel="Close"
          />
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <TextInput
            label="Component Name"
            helpText="Enter a descriptive name for this component"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., start city"
            required
            error={error && !name.trim() ? 'Component name is required' : null}
          />

          <TextDescriptionInput
            label="Description"
            helpText="Optional description for this component"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />

          <ToggleInput
            label="This component has split variables"
            helpText="Enable this if your component needs multiple parts (e.g., a and b)"
            checked={isSplit}
            onChange={(e) => {
              setIsSplit(e.target.checked);
              if (e.target.checked) {
                setNumberOfSplits(2);
                setSplitParts(['a', 'b']);
                setVariants([null]); // Start with one empty variant
              } else {
                setNumberOfSplits(2);
                setSplitParts(['a', 'b']);
                setVariants([null]); // Start with one empty variant
              }
            }}
          />

          {isSplit && (
            <div className="split-configuration">
              <TextInput
                label="Number of Split Parts"
                helpText="Minimum 2 parts required"
                type="number"
                value={numberOfSplits}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  if (num >= 2) {
                    setNumberOfSplits(num);
                    // Update splitParts array, preserving existing names or using defaults
                    const newParts = [];
                    for (let i = 0; i < num; i++) {
                      if (i < splitParts.length) {
                        newParts.push(splitParts[i]);
                      } else {
                        // Generate default names: a, b, c, d, etc.
                        newParts.push(String.fromCharCode(97 + i)); // 97 is 'a'
                      }
                    }
                    setSplitParts(newParts);
                    setVariants([null]); // Reset variants when split config changes
                  }
                }}
                min="2"
                required
              />

              <div className="split-parts-naming">
                <label className="split-parts-label">
                  Split Part Names *
                  <span className="help-text">Each part must have a unique name</span>
                </label>
                <div className="split-parts-inputs">
                  {splitParts.map((part, index) => (
                    <TextInput
                      key={index}
                      label={`Part ${index + 1} Name`}
                      value={part}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const updated = [...splitParts];
                        updated[index] = newName;
                        setSplitParts(updated);
                        // Reset variants when part names change
                        setVariants([null]);
                      }}
                      placeholder={`e.g., ${String.fromCharCode(97 + index)}`}
                      required
                    />
                  ))}
                </div>
              </div>
            </div>
          )}


          <div className="variants-section">
            <label>Variants * (at least 2 required)</label>
            
            <div className="variants-list">
              {variants.map((variant, index) => {
                const canDelete = variants.filter(v => v !== null).length > 2;
                
                if (isSplit) {
                  return (
                    <SplitVariantsEditBox
                      key={index}
                      value={variant}
                      parts={splitParts}
                      onChange={(value) => handleVariantChange(index, value)}
                      onSave={(value) => handleVariantSave(index, value)}
                      onEdit={() => handleVariantEdit(index)}
                      onDelete={() => handleVariantDelete(index)}
                      canDelete={canDelete}
                    />
                  );
                } else {
                  return (
                    <NonSplitVariantEditBox
                      key={index}
                      value={variant}
                      onChange={(value) => handleVariantChange(index, value)}
                      onSave={(value) => handleVariantSave(index, value)}
                      onEdit={() => handleVariantEdit(index)}
                      onDelete={() => handleVariantDelete(index)}
                      canDelete={canDelete}
                      placeholder="Enter variant"
                    />
                  );
                }
              })}
            </div>

            <div className="add-variant">
              <PrimaryButton onClick={handleAddNewVariant}>
                Add Variant
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <SecondaryButton onClick={handleClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Create Component'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default ComponentCreateModal;

