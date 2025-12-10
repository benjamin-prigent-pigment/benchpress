import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IoCheckmark, IoClose, IoSave, IoDownload } from 'react-icons/io5';
import { useTemplate } from '../hooks/useTemplate';
import { useComponents } from '../hooks/useComponents';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { useTemplateEditor } from '../hooks/useTemplateEditor';
import SecondaryPageHeader from '../components/header/SecondaryPageHeader';
import TemplateEditor from '../components/TemplateEditor';
import TemplatePreview from '../components/TemplatePreview';
import PrimaryButton from '../components/buttons/PrimaryButton';
import SecondaryButton from '../components/buttons/SecondaryButton';
import IconGreyButton from '../components/buttons/IconGreyButton';
import './TemplateItem.css';

function TemplateItem() {
  const { id } = useParams();
  const editorRef = useRef(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingMetadata, setSavingMetadata] = useState(false);
  
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
    deleteTemplate,
    updateTemplateMetadata
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

  // Initialize edit fields when template loads or when entering edit mode
  useEffect(() => {
    if (template) {
      setEditName(template.name || '');
      setEditDescription(template.description || '');
    }
  }, [template, isEditingMetadata]);

  const handleStartEdit = () => {
    setIsEditingMetadata(true);
  };

  const handleCancelEdit = () => {
    setIsEditingMetadata(false);
    if (template) {
      setEditName(template.name || '');
      setEditDescription(template.description || '');
    }
  };

  const handleSaveMetadata = async () => {
    if (!editName.trim()) {
      return;
    }

    try {
      setSavingMetadata(true);
      await updateTemplateMetadata(editName.trim(), editDescription.trim());
      setIsEditingMetadata(false);
    } catch (err) {
      console.error('Failed to save template metadata:', err);
    } finally {
      setSavingMetadata(false);
    }
  };

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
        onEdit={!isEditingMetadata ? handleStartEdit : undefined}
        editLabel="Edit template name and description"
        onDelete={deleteTemplate}
        deleteLabel="Delete Template"
        className="template-header"
      />

      {error && <div className="error">{error}</div>}

      <div className="template-item-body-wrapper">
        <div className="template-metadata">
          {isEditingMetadata ? (
            <div className="template-metadata-edit">
              <div className="metadata-edit-field">
                <label htmlFor="template-name">Template Name *</label>
                <input
                  id="template-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Template name"
                  disabled={savingMetadata}
                />
              </div>
              <div className="metadata-edit-field">
                <label htmlFor="template-description">Description</label>
                <textarea
                  id="template-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Template description (optional)"
                  rows={3}
                  disabled={savingMetadata}
                />
              </div>
            </div>
          ) : (
            <div className="template-metadata-display">
              {template.description && (
                <div className="template-description">
                  {template.description}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="template-preview-editor-container">
        <div className="template-editor">
          <div className="editor-header">
            <h3>Template Editor</h3>
            <div className="editor-header-right">
              <div className="permutation-counter">
                Permutations: <strong>{permutationCount}</strong>
              </div>
              {isEditingMetadata && (
                <>
                  <IconGreyButton
                    icon={<IoCheckmark size={20} />}
                    onClick={handleSaveMetadata}
                    disabled={savingMetadata || !editName.trim()}
                    ariaLabel={savingMetadata ? 'Saving...' : 'Save metadata'}
                    title={savingMetadata ? 'Saving...' : 'Save metadata'}
                  />
                  <IconGreyButton
                    icon={<IoClose size={20} />}
                    onClick={handleCancelEdit}
                    disabled={savingMetadata}
                    ariaLabel="Cancel editing"
                    title="Cancel editing"
                  />
                </>
              )}
              <IconGreyButton
                icon={<IoSave size={20} />}
                onClick={saveTemplate}
                disabled={saving}
                ariaLabel={saving ? 'Saving...' : 'Save template'}
                title={saving ? 'Saving...' : 'Save template'}
              />
              <IconGreyButton
                icon={<IoDownload size={20} />}
                onClick={generateCSV}
                disabled={permutationCount === 0}
                ariaLabel="Generate CSV"
                title="Generate CSV"
              />
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
        </div>
        <TemplatePreview template={template} text={text} componentsMap={componentsMap} />
        </div>
      </div>
    </div>
  );
}

export default TemplateItem;
