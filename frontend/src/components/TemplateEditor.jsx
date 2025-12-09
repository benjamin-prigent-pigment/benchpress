import React from 'react';
import AutocompleteDropdown from './AutocompleteDropdown';

/**
 * Template editor component with contentEditable and autocomplete
 */
function TemplateEditor({
  editorRef,
  text,
  onInput,
  onKeyDown,
  showAutocomplete,
  autocompleteOptions,
  selectedAutocompleteIndex,
  onSelectComponent,
  onAutocompleteMouseEnter,
  autocompletePosition
}) {
  return (
    <div className="template-text-container">
      <div
        ref={editorRef}
        className="template-editor-input"
        contentEditable
        onInput={onInput}
        onKeyDown={onKeyDown}
        data-placeholder="Enter your template text here. Use {{component_name}} to insert components."
        suppressContentEditableWarning={true}
      />
      {showAutocomplete && autocompleteOptions.length > 0 && (
        <AutocompleteDropdown
          options={autocompleteOptions}
          selectedIndex={selectedAutocompleteIndex}
          onSelect={onSelectComponent}
          onMouseEnter={onAutocompleteMouseEnter}
          position={autocompletePosition}
        />
      )}
    </div>
  );
}

export default TemplateEditor;

