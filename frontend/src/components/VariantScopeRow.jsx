import React from 'react';
import './VariantScopeRow.css';

/**
 * VariantScopeRow - One variant with checkboxes for allowed components
 * Props:
 * - variant: the variant object (string for regular, dict for split)
 * - variantIndex: index of this variant
 * - componentName: name of the component this variant belongs to
 * - isSplit: whether the component is split
 * - splitParts: array of split part names (if split)
 * - otherComponents: array of other component names that can be allowed/restricted
 * - allowedComponents: array of component names currently allowed for this variant
 * - onChange: callback(allowedComponents[]) when checkboxes change
 */
function VariantScopeRow({
  variant,
  variantIndex,
  componentName,
  isSplit,
  splitParts,
  otherComponents,
  allowedComponents,
  onChange
}) {
  // If no other components, nothing to show
  if (!otherComponents || otherComponents.length === 0) {
    return null;
  }

  // Get variant display text
  const getVariantText = () => {
    if (isSplit && typeof variant === 'object') {
      // For split components, show all parts
      return splitParts.map(part => `${part}: ${variant[part] || ''}`).join(', ');
    }
    return String(variant);
  };

  // Check if all components are allowed
  const allAllowed = otherComponents.every(comp => allowedComponents.includes(comp));

  // Handle checkbox change
  const handleCheckboxChange = (compName, checked) => {
    if (checked) {
      // Add to allowed list if not already present
      if (!allowedComponents.includes(compName)) {
        onChange([...allowedComponents, compName]);
      }
    } else {
      // Remove from allowed list
      onChange(allowedComponents.filter(c => c !== compName));
    }
  };

  // Handle select/deselect all
  const handleSelectAll = () => {
    if (allAllowed) {
      // Deselect all
      onChange([]);
    } else {
      // Select all
      onChange([...otherComponents]);
    }
  };

  return (
    <div className="variant-scope-row">
      <div className="variant-scope-row-header">
        <div className="variant-scope-row-variant">
          <span className="variant-index">#{variantIndex + 1}</span>
          <span className="variant-text">{getVariantText()}</span>
        </div>
        <button
          type="button"
          className="select-all-button"
          onClick={handleSelectAll}
          title={allAllowed ? 'Deselect all' : 'Select all'}
        >
          {allAllowed ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="variant-scope-row-checkboxes">
        {otherComponents.map(compName => {
          const isChecked = allowedComponents.includes(compName);
          return (
            <label key={compName} className="checkbox-label">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleCheckboxChange(compName, e.target.checked)}
              />
              <span>{compName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default VariantScopeRow;
