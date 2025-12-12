import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';
import './AddRuleModal.css';

/**
 * AddRuleModal - Modal for adding a new deny rule
 * Props:
 * - isOpen: boolean, whether modal is open
 * - onClose: callback when closing modal
 * - onAdd: callback(variant1Id, variant2Id) when rule is added
 * - componentsMap: map of component name -> component object
 * - templateComponents: array of component names in template
 */
function AddRuleModal({
  isOpen,
  onClose,
  onAdd,
  componentsMap,
  templateComponents = []
}) {
  const [variant1, setVariant1] = useState('');
  const [variant2, setVariant2] = useState([]);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setVariant1('');
      setVariant2([]);
      setError('');
    }
  }, [isOpen]);

  // Generate list of all variants from all components in template
  // Format: { id: "ComponentName:variantIndex", label: "ComponentName: VariantText" }
  const getAllVariants = () => {
    return templateComponents.flatMap(compName => {
      const component = componentsMap[compName];
      if (!component || !component.variants) {
        return [];
      }
      
      const isSplit = component.isSplit || false;
      const splitParts = component.splitParts || [];
      
      return component.variants.map((variant, variantIndex) => {
        // Format variant display text
        let variantText;
        if (isSplit && typeof variant === 'object') {
          variantText = splitParts.map(part => `${variant[part] || ''}`).join(': ');
        } else {
          variantText = String(variant);
        }
        
        const id = `${compName}:${variantIndex}`;
        const label = `${compName}: ${variantText}`;
        
        return { id, label };
      });
    });
  };

  const variants = getAllVariants();

  // Filter out the selected primary variant from the second dropdown options
  const availableVariants2 = variants.filter(v => v.id !== variant1);

  const handleAdd = () => {
    // Validation
    if (!variant1) {
      setError('Please select a primary variant');
      return;
    }

    if (!variant2 || variant2.length === 0) {
      setError('Please select at least one variant to deny');
      return;
    }

    // Call onAdd for each selected variant2
    variant2.forEach(v2Id => {
      onAdd(variant1, v2Id);
    });
    
    onClose();
  };

  const handleClose = () => {
    setVariant1('');
    setVariant2([]);
    setError('');
    onClose();
  };

  const handleVariant2Change = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setVariant2(selectedOptions);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Deny Rule</h2>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <IoClose size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="variant1-select">Primary Variant</label>
            <select
              id="variant1-select"
              value={variant1}
              onChange={(e) => {
                setVariant1(e.target.value);
                setVariant2([]); // Reset variant2 when primary changes
                setError('');
              }}
            >
              <option value="">Select a primary variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="variant2-select">
              Deny Variants (Select multiple)
              {variant2.length > 0 && (
                <span className="selection-count"> ({variant2.length} selected)</span>
              )}
            </label>
            <select
              id="variant2-select"
              multiple
              size={Math.min(8, availableVariants2.length)}
              value={variant2}
              onChange={handleVariant2Change}
              disabled={!variant1}
              className={!variant1 ? 'disabled-select' : ''}
            >
              {availableVariants2.length === 0 ? (
                <option disabled>No other variants available</option>
              ) : (
                availableVariants2.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))
              )}
            </select>
            {!variant1 && (
              <div className="field-hint">Please select a primary variant first</div>
            )}
            {variant1 && (
              <div className="field-hint">Hold Ctrl/Cmd to select multiple variants</div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <SecondaryButton onClick={handleClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleAdd}>
              Add {variant2.length > 0 ? `${variant2.length} Rule${variant2.length > 1 ? 's' : ''}` : 'Rule'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddRuleModal;

