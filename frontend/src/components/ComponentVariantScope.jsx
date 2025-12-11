import React from 'react';
import VariantScopeRow from './VariantScopeRow';
import './ComponentVariantScope.css';

/**
 * ComponentVariantScope - One component with its variants
 * Props:
 * - componentName: name of this component
 * - component: component object with variants, isSplit, splitParts
 * - otherComponents: array of other component names
 * - variantScopes: current variant scopes dict
 * - onScopeChange: callback(variantIndex, allowedComponents[]) when scope changes
 */
function ComponentVariantScope({
  componentName,
  component,
  otherComponents,
  variantScopes,
  onScopeChange
}) {
  if (!component) {
    return null;
  }

  const variants = component.variants || [];
  const isSplit = component.isSplit || false;
  const splitParts = component.splitParts || [];

  // Get allowed components for a variant (defaults to all if not specified)
  const getAllowedComponents = (variantIndex) => {
    const componentScopes = variantScopes[componentName] || {};
    const scope = componentScopes[variantIndex];
    // If scope is defined, return it; otherwise return all other components (default)
    return scope !== undefined ? scope : otherComponents;
  };

  return (
    <div className="component-variant-scope">
      <div className="component-variant-scope-header">
        <h4 className="component-name">{componentName}</h4>
        {component.description && (
          <p className="component-description">{component.description}</p>
        )}
      </div>
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
              otherComponents={otherComponents}
              allowedComponents={allowedComponents}
              onChange={(newAllowedComponents) => {
                onScopeChange(variantIndex, newAllowedComponents);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ComponentVariantScope;
