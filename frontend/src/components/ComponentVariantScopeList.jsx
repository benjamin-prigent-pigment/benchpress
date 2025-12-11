import React from 'react';
import ComponentVariantScope from './ComponentVariantScope';
import './ComponentVariantScopeList.css';

/**
 * ComponentVariantScopeList - Lists all components with their variant scopes
 * Props:
 * - components: array of component names in the template
 * - componentsMap: map of component name -> component object
 * - variantScopes: current variant scopes dict
 * - onScopeChange: callback(componentName, variantIndex, allowedComponents[]) when scope changes
 */
function ComponentVariantScopeList({
  components,
  componentsMap,
  variantScopes,
  onScopeChange
}) {
  if (!components || components.length === 0) {
    return (
      <div className="component-variant-scope-list-empty">
        No components found in template
      </div>
    );
  }

  return (
    <div className="component-variant-scope-list">
      {components.map((componentName) => {
        const component = componentsMap[componentName];
        if (!component) {
          return null;
        }

        // Get all other components (excluding current)
        const otherComponents = components.filter(c => c !== componentName);

        return (
          <ComponentVariantScope
            key={componentName}
            componentName={componentName}
            component={component}
            otherComponents={otherComponents}
            componentsMap={componentsMap}
            variantScopes={variantScopes}
            onScopeChange={(variantIndex, allowedComponents) => {
              onScopeChange(componentName, variantIndex, allowedComponents);
            }}
          />
        );
      })}
    </div>
  );
}

export default ComponentVariantScopeList;
