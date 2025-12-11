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
      return splitParts.map(part => `${variant[part] || ''}`).join(': ');
    }
    return String(variant);
  };

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

  return (
    <div className="variant-scope-row">
      <div className="variant-scope-row-header">
        <span className="variant-text">{getVariantText()}</span>
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
