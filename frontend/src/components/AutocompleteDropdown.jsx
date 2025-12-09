import React from 'react';

/**
 * Autocomplete dropdown component for component selection
 */
function AutocompleteDropdown({
  options,
  selectedIndex,
  onSelect,
  onMouseEnter,
  position
}) {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div
      className="autocomplete-dropdown"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      {options.map((option, index) => (
        <div
          key={`${option.component.id}-${option.part || 'main'}`}
          className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(option)}
          onMouseEnter={() => onMouseEnter(index)}
        >
          <span className="autocomplete-name">{option.displayName}</span>
          <span className="autocomplete-variants">
            {option.component.variants?.length || 0} variant{(option.component.variants?.length || 0) !== 1 ? 's' : ''}
            {option.type === 'split-part' && ` (${option.part})`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default AutocompleteDropdown;

