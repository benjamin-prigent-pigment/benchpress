import React, { useState } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import './VariantScopeRow.css';

/**
 * VariantScopeRow - One variant with checkboxes for allowed variants
 * Props:
 * - variant: the variant object (string for regular, dict for split)
 * - variantIndex: index of this variant
 * - componentName: name of the component this variant belongs to
 * - isSplit: whether the component is split
 * - splitParts: array of split part names (if split)
 * - otherVariants: array of variant objects from other components {componentName, variantIndex, variant, isSplit, splitParts}
 * - allowedComponents: array of variant identifiers ("ComponentName:variantIndex") currently allowed for this variant
 * - onChange: callback(allowedComponents[]) when checkboxes change
 */
function VariantScopeRow({
  variant,
  componentName,
  isSplit,
  splitParts,
  otherVariants,
  allowedComponents,
  onChange
}) {
  // If no other variants, nothing to show
  if (!otherVariants || otherVariants.length === 0) {
    return null;
  }

  // State for open/close
  const [isOpen, setIsOpen] = useState(false);

  // Get variant display text
  const getVariantText = () => {
    if (isSplit && typeof variant === 'object') {
      // For split components, show all parts
      return splitParts.map(part => `${variant[part] || ''}`).join(': ');
    }
    return String(variant);
  };

  // Get display text for another variant
  const getOtherVariantText = (otherVariant) => {
    if (otherVariant.isSplit && typeof otherVariant.variant === 'object') {
      return otherVariant.splitParts.map(part => `${otherVariant.variant[part] || ''}`).join(': ');
    }
    return String(otherVariant.variant);
  };

  // Get variant identifier
  const getVariantId = (otherVariant) => {
    return `${otherVariant.componentName}:${otherVariant.variantIndex}`;
  };

  // Handle checkbox change
  const handleCheckboxChange = (variantId, checked) => {
    if (checked) {
      // Add to allowed list if not already present
      if (!allowedComponents.includes(variantId)) {
        onChange([...allowedComponents, variantId]);
      }
    } else {
      // Remove from allowed list
      onChange(allowedComponents.filter(id => id !== variantId));
    }
  };

  // Calculate checked count
  const checkedCount = allowedComponents.length;
  const totalCount = otherVariants.length;

  return (
    <div className="variant-scope-row">
      <div 
        className="variant-scope-row-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <span className="variant-text">{getVariantText()}</span>
        <div className="header-right">
          <span className="counter-text">{checkedCount}/{totalCount}</span>
          <IoChevronDown 
            className={`chevron-icon ${isOpen ? 'open' : ''}`}
            size={18}
          />
        </div>
      </div>
      {isOpen && (
        <div className="variant-scope-row-checkboxes">
          {otherVariants.map(otherVariant => {
            const variantId = getVariantId(otherVariant);
            const isChecked = allowedComponents.includes(variantId);
            const displayText = `${otherVariant.componentName}: ${getOtherVariantText(otherVariant)}`;
            return (
              <label key={variantId} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(variantId, e.target.checked)}
                />
                <span>{displayText}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VariantScopeRow;
