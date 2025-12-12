import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import PrimaryButton from './buttons/PrimaryButton';
import SecondaryButton from './buttons/SecondaryButton';
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
  const [variant2, setVariant2] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setVariant1('');
      setVariant2('');
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

  const handleAdd = () => {
    // Validation
    if (!variant1 || !variant2) {
      setError('Please select both variants');
      return;
    }

    if (variant1 === variant2) {
      setError('Cannot select the same variant twice');
      return;
    }

    // Call onAdd with variant IDs
    onAdd(variant1, variant2);
    onClose();
  };

  const handleClose = () => {
    setVariant1('');
    setVariant2('');
    setError('');
    onClose();
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
            <label htmlFor="variant1-select">First Variant</label>
            <select
              id="variant1-select"
              value={variant1}
              onChange={(e) => {
                setVariant1(e.target.value);
                setError('');
              }}
            >
              <option value="">Select a variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="variant2-select">Second Variant</label>
            <select
              id="variant2-select"
              value={variant2}
              onChange={(e) => {
                setVariant2(e.target.value);
                setError('');
              }}
            >
              <option value="">Select a variant</option>
              {variants.map(v => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
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
              Add Rule
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddRuleModal;

