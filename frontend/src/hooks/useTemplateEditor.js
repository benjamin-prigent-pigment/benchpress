import { useEffect, useRef } from 'react';
import {
  extractTextFromEditor,
  renderTextWithPlaceholders,
  findLastOpenPlaceholder,
  restoreCursorPosition,
  getCursorPosition
} from '../utils/templateUtils';

/**
 * Custom hook for template editor functionality
 */
export const useTemplateEditor = (text, setText, componentsMap, autocomplete, editorRef) => {
  const isSelectingComponentRef = useRef(false);
  const lastUserInputTimeRef = useRef(0);
  const lastRenderedTextRef = useRef('');
  const isInitializedRef = useRef(false);
  const {
    showAutocomplete,
    setShowAutocomplete,
    setAutocompleteQuery,
    setAutocompletePosition,
    selectedAutocompleteIndex,
    setSelectedAutocompleteIndex,
    filteredComponents,
    autocompleteContextRef
  } = autocomplete;

  // Handle input in the editor
  const handleEditorInput = (e) => {
    const editor = e.target;
    const plainText = extractTextFromEditor(editor.innerHTML);
    
    // Record the time of user input to prevent useEffect from interfering
    lastUserInputTimeRef.current = Date.now();
    setText(plainText);
    
    // Check if we're typing "{{" or inside a placeholder
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Get text up to cursor position
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editor);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const textBeforeCursor = preCaretRange.toString();
      
      // Check if we're inside an open placeholder
      const lastOpen = textBeforeCursor.lastIndexOf('{{');
      
      if (lastOpen !== -1) {
        const afterOpen = textBeforeCursor.substring(lastOpen + 2);
        const nextClose = afterOpen.indexOf('}}');
        
        if (nextClose === -1) {
          // We're inside an open placeholder - show autocomplete
          const rect = range.getBoundingClientRect();
          const editorRect = editor.getBoundingClientRect();
          
          // Store cursor position and placeholder info for later use
          const cursorPos = textBeforeCursor.length;
          autocompleteContextRef.current = {
            cursorPosition: cursorPos,
            placeholderStart: lastOpen,
            textAtShow: plainText
          };
          
          setAutocompletePosition({
            top: rect.bottom - editorRect.top + editor.scrollTop + 5,
            left: rect.left - editorRect.left + editor.scrollLeft
          });
          setAutocompleteQuery(afterOpen);
          setShowAutocomplete(true);
          setSelectedAutocompleteIndex(0);
        } else {
          // Placeholder is closed
          setShowAutocomplete(false);
        }
      } else {
        // No open placeholder
        setShowAutocomplete(false);
      }
    }
  };

  // Handle keydown in editor
  const handleEditorKeyDown = (e) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          Math.min(prev + 1, filteredComponents.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectComponent(filteredComponents[selectedAutocompleteIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
      }
    }
  };

  // Select a component or split part from autocomplete
  const selectComponent = (option) => {
    if (!option || !editorRef.current) return;
    
    const placeholder = `{{${option.fullName}}}`;
    const editor = editorRef.current;
    const currentPlainText = extractTextFromEditor(editor.innerHTML);
    
    // Use stored context from when autocomplete was shown
    const context = autocompleteContextRef.current;
    const lastOpen = context.placeholderStart;
    const cursorPosition = context.cursorPosition;
    
    if (lastOpen === -1 || cursorPosition === undefined) {
      // Fallback: try to get from current selection
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editor);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const textBeforeCursor = preCaretRange.toString();
      const fallbackCursorPos = textBeforeCursor.length;
      const fallbackLastOpen = findLastOpenPlaceholder(textBeforeCursor);
      
      if (fallbackLastOpen === -1) return;
      
      // Use fallback positions
      const beforePlaceholder = currentPlainText.substring(0, fallbackLastOpen);
      const afterPlaceholder = currentPlainText.substring(fallbackCursorPos);
      const newText = beforePlaceholder + placeholder + afterPlaceholder;
      
      // Set flag to prevent useEffect from interfering
      isSelectingComponentRef.current = true;
      setText(newText);
      setShowAutocomplete(false);
      
      // Update editor and move cursor after the placeholder
      setTimeout(() => {
        const styledHtml = renderTextWithPlaceholders(newText, componentsMap);
        editor.innerHTML = styledHtml;
        lastRenderedTextRef.current = newText;
        
        const newPosition = beforePlaceholder.length + placeholder.length;
        restoreCursorPosition(editor, newPosition);
        
        // Ensure editor maintains focus
        editor.focus();
        
        isSelectingComponentRef.current = false;
      }, 0);
      return;
    }
    
    // Use stored positions - but account for any text changes since autocomplete was shown
    // We need to find the placeholder start in the current text
    // The stored position was relative to the text at that time
    // We'll search for the {{ that matches our stored context
    
    // Find the matching {{ in current text by looking for similar context
    // We'll use the stored lastOpen position, but verify it's still valid
    let actualLastOpen = lastOpen;
    
    // If the text has changed, we need to find the correct position
    // Try to find the {{ that's still open in the current text
    const currentTextBeforeCursor = currentPlainText.substring(0, Math.min(cursorPosition, currentPlainText.length));
    const currentLastOpen = findLastOpenPlaceholder(currentTextBeforeCursor);
    
    if (currentLastOpen !== -1) {
      actualLastOpen = currentLastOpen;
    } else {
      // Fallback to stored position, but clamp to valid range
      actualLastOpen = Math.min(lastOpen, currentPlainText.length);
    }
    
    // The placeholder should end at the cursor position (where we're typing)
    // Use the current cursor position or the stored one, whichever makes sense
    const placeholderEnd = Math.min(cursorPosition, currentPlainText.length);
    
    // Replace the query with the component name/part
    const beforePlaceholder = currentPlainText.substring(0, actualLastOpen);
    const afterPlaceholder = currentPlainText.substring(placeholderEnd);
    const newText = beforePlaceholder + placeholder + afterPlaceholder;
    
    // Set flag to prevent useEffect from interfering
    isSelectingComponentRef.current = true;
    setText(newText);
    setShowAutocomplete(false);
    
    // Update editor and move cursor after the placeholder
    setTimeout(() => {
      const styledHtml = renderTextWithPlaceholders(newText, componentsMap);
      editor.innerHTML = styledHtml;
      lastRenderedTextRef.current = newText;
      
      const newPosition = beforePlaceholder.length + placeholder.length;
      restoreCursorPosition(editor, newPosition);
      
      // Ensure editor maintains focus
      editor.focus();
      
      isSelectingComponentRef.current = false;
    }, 0);
  };

  // Update editor HTML only when:
  // 1. Initial load (componentsMap becomes available)
  // 2. External text changes (not from user typing)
  // 3. Component selection (handled separately)
  useEffect(() => {
    if (!editorRef.current || !text || Object.keys(componentsMap).length === 0) {
      return;
    }

    // Skip if user is typing (within last 200ms)
    const timeSinceLastInput = Date.now() - lastUserInputTimeRef.current;
    const isRecentUserInput = timeSinceLastInput < 200;
    
    // Skip if selecting component or autocomplete is showing
    if (isRecentUserInput || isSelectingComponentRef.current || showAutocomplete) {
      return;
    }

    const currentPlainText = extractTextFromEditor(editorRef.current.innerHTML);
    
    // Only update if text actually changed and it's different from what's in the editor
    // This prevents re-rendering during normal typing
    if (text !== currentPlainText && text !== lastRenderedTextRef.current) {
      // Save cursor position before updating
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      let cursorOffset = 0;
      
      if (range && editorRef.current.contains(range.commonAncestorContainer)) {
        cursorOffset = getCursorPosition(range, editorRef.current);
      }
      
      // Update editor HTML
      const styledHtml = renderTextWithPlaceholders(text, componentsMap);
      editorRef.current.innerHTML = styledHtml;
      lastRenderedTextRef.current = text;
      isInitializedRef.current = true;
      
      // Restore cursor position
      if (cursorOffset > 0) {
        restoreCursorPosition(editorRef.current, cursorOffset);
      }
    } else if (!isInitializedRef.current && text) {
      // Initial load: set editor content
      const styledHtml = renderTextWithPlaceholders(text, componentsMap);
      editorRef.current.innerHTML = styledHtml;
      lastRenderedTextRef.current = text;
      isInitializedRef.current = true;
    }
  }, [text, componentsMap, showAutocomplete]);

  return {
    handleEditorInput,
    handleEditorKeyDown,
    selectComponent
  };
};

