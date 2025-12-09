import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTemplate } from '../hooks/useTemplate';
import { useComponents } from '../hooks/useComponents';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { useTemplateEditor } from '../hooks/useTemplateEditor';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import TemplateEditor from '../components/TemplateEditor';
import './TemplateItem.css';

function TemplateItem() {
  const { id } = useParams();
  const editorRef = useRef(null);
  
  // Template operations
  const {
    template,
    text,
    setText,
    permutationCount,
    loading,
    saving,
    error,
    saveTemplate,
    generateCSV,
    deleteTemplate
  } = useTemplate(id);

  // Components data
  const { components, componentsMap } = useComponents();

  // Autocomplete functionality
  const autocomplete = useAutocomplete(components, componentsMap, editorRef);
  const {
    showAutocomplete,
    autocompletePosition,
    selectedAutocompleteIndex,
    setSelectedAutocompleteIndex,
    filteredComponents
  } = autocomplete;

  // Editor functionality
  const { handleEditorInput, handleEditorKeyDown, selectComponent } = 
    useTemplateEditor(text, setText, componentsMap, autocomplete, editorRef);

  if (loading) {
    return <div className="template-item">Loading...</div>;
  }

  if (!template) {
    return <div className="template-item">Template not found</div>;
  }

  return (
    <div className="template-item">
      <SecondaryPageHeader
        title={template.name}
        backPath="/templates"
        backLabel="Back to Templates"
        onDelete={deleteTemplate}
        deleteLabel="Delete Template"
        className="template-header"
      />

      {error && <div className="error">{error}</div>}

      <div className="template-editor">
        <div className="editor-header">
          <label htmlFor="template-text">Template Text (use {'{{component_name}}'} for placeholders)</label>
          <div className="permutation-counter">
            Permutations: <strong>{permutationCount}</strong>
          </div>
        </div>
        <TemplateEditor
          editorRef={editorRef}
          text={text}
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          showAutocomplete={showAutocomplete}
          autocompleteOptions={filteredComponents}
          selectedAutocompleteIndex={selectedAutocompleteIndex}
          onSelectComponent={selectComponent}
          onAutocompleteMouseEnter={setSelectedAutocompleteIndex}
          autocompletePosition={autocompletePosition}
        />
        <div className="editor-actions">
          <button 
            className="btn-primary" 
            onClick={saveTemplate}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button 
            className="btn-success" 
            onClick={generateCSV}
            disabled={permutationCount === 0}
          >
            Generate CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateItem;
