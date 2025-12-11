import React, { useState } from 'react';
import { IoChevronDown } from 'react-icons/io5';
import VariantScopeRow from './VariantScopeRow';
import './ComponentVariantScope.css';

/**
 * ComponentVariantScope - One component with its variants
 * Props:
 * - componentName: name of this component
 * - component: component object with variants, isSplit, splitParts
 * - otherComponents: array of other component names
 * - componentsMap: map of component name -> component object
 * - variantScopes: current variant scopes dict
 * - onScopeChange: callback(variantIndex, allowedComponents[]) when scope changes
 */
function ComponentVariantScope({
  componentName,
  component,
  otherComponents,
  componentsMap,
  variantScopes,
  onScopeChange
}) {
  if (!component) {
    return null;
  }

  const variants = component.variants || [];
  const isSplit = component.isSplit || false;
  const splitParts = component.splitParts || [];

  // State for open/close
  const [isOpen, setIsOpen] = useState(false);

  // Generate list of all variants from other components
  // Format: { componentName, variantIndex, variant, isSplit, splitParts }
  const otherVariants = otherComponents.flatMap(otherCompName => {
    const otherComponent = componentsMap[otherCompName];
    if (!otherComponent || !otherComponent.variants) {
      return [];
    }
    const otherIsSplit = otherComponent.isSplit || false;
    const otherSplitParts = otherComponent.splitParts || [];
    return otherComponent.variants.map((variant, variantIndex) => ({
      componentName: otherCompName,
      variantIndex,
      variant,
      isSplit: otherIsSplit,
      splitParts: otherSplitParts
    }));
  });

  // Get allowed variants for a variant (defaults to all if not specified)
  // allowedComponents stores variant identifiers in format "ComponentName:variantIndex"
  const getAllowedComponents = (variantIndex) => {
    const componentScopes = variantScopes[componentName] || {};
    const scope = componentScopes[variantIndex];
    // If scope is defined, return it; otherwise return all other variants (default)
    if (scope !== undefined) {
      return scope;
    }
    // Return all variant identifiers as default
    return otherVariants.map(v => `${v.componentName}:${v.variantIndex}`);
  };

  return (
    <div className="component-variant-scope">
      <div 
        className="component-variant-scope-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <h4 className="component-name">{componentName}</h4>
        <IoChevronDown 
          className={`chevron-icon ${isOpen ? 'open' : ''}`}
          size={18}
        />
      </div>
      {isOpen && (
        <div className="component-variant-scope-variants">
          {variants.map((variant, variantIndex) => {
            const allowedComponents = getAllowedComponents(variantIndex);
            return (
              <VariantScopeRow
                key={variantIndex}
                variant={variant}
                variantIndex={variantIndex}
                componentName={componentName}
                isSplit={isSplit}
                splitParts={splitParts}
                otherVariants={otherVariants}
                allowedComponents={allowedComponents}
                onChange={(newAllowedComponents) => {
                  onScopeChange(variantIndex, newAllowedComponents);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ComponentVariantScope;
