/**
 * Utility functions for template text manipulation
 */

/**
 * Extract plain text from contentEditable div HTML
 */
export const extractTextFromEditor = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Parse text and render with styled placeholders
 * @param {string} text - The template text
 * @param {Object} componentsMap - Map of component names to component objects
 * @returns {string} HTML string with styled placeholders
 */
export const renderTextWithPlaceholders = (text, componentsMap) => {
  if (!text) return '';
  
  const parts = [];
  // Pattern matches: {{component_name}} or {{component_name/part}}
  const placeholderRegex = /\{\{([^}/]+)(?:\/([^}]+))?\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = placeholderRegex.exec(text)) !== null) {
    // Add text before the placeholder
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    // Add the placeholder
    const componentName = match[1].trim();
    const part = match[2] ? match[2].trim() : null;
    const component = componentsMap[componentName];
    const variantCount = component ? (component.variants?.length || 0) : 0;
    
    let title = componentName;
    if (part) {
      title += `/${part}`;
    }
    title += `: ${variantCount} variant${variantCount !== 1 ? 's' : ''}`;

    parts.push({
      type: 'placeholder',
      componentName: componentName,
      part: part,
      variantCount: variantCount,
      fullMatch: match[0],
      title: title
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return parts.map((part) => {
    if (part.type === 'text') {
      return part.content;
    } else {
      return `<span class="template-placeholder" title="${part.title}" contenteditable="false">${part.fullMatch}</span>`;
    }
  }).join('');
};

/**
 * Find the position of the last open placeholder before cursor
 * @param {string} textBeforeCursor - Text content before the cursor
 * @returns {number} Index of the last open {{ or -1 if not found
 */
export const findLastOpenPlaceholder = (textBeforeCursor) => {
  let lastOpen = -1;
  let searchStart = 0;
  
  while (true) {
    const found = textBeforeCursor.indexOf('{{', searchStart);
    if (found === -1) break;
    
    // Check if this {{ has a matching }} before the cursor
    const afterFound = textBeforeCursor.substring(found + 2);
    const nextClose = afterFound.indexOf('}}');
    
    if (nextClose === -1) {
      // This {{ doesn't have a closing }}, so it's the open one we're typing
      lastOpen = found;
      break;
    } else {
      // This {{ is closed, continue searching
      searchStart = found + 2 + nextClose + 2;
    }
  }
  
  // Fallback: if we didn't find an open one, use the last {{ anyway
  if (lastOpen === -1) {
    lastOpen = textBeforeCursor.lastIndexOf('{{');
  }
  
  return lastOpen;
};

/**
 * Restore cursor position in a contentEditable element
 * @param {HTMLElement} editor - The contentEditable element
 * @param {number} cursorOffset - The desired cursor position in plain text
 */
export const restoreCursorPosition = (editor, cursorOffset) => {
  if (!editor || cursorOffset < 0) return;
  
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Walk through all nodes in the editor
    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    );
    
    let currentOffset = 0;
    let node = walker.nextNode();
    
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nodeLength = node.textContent.length;
        if (currentOffset + nodeLength >= cursorOffset) {
          // Found the text node containing our position
          const offsetInNode = cursorOffset - currentOffset;
          range.setStart(node, Math.min(offsetInNode, node.textContent.length));
          range.setEnd(node, Math.min(offsetInNode, node.textContent.length));
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        currentOffset += nodeLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Check if it's a placeholder span
        if (node.classList && node.classList.contains('template-placeholder')) {
          const spanText = node.textContent || '';
          const spanLength = spanText.length;
          
          // If cursor is at the end of or after this placeholder, place cursor after the span
          if (cursorOffset <= currentOffset + spanLength) {
            range.setStartAfter(node);
            range.setEndAfter(node);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
          }
          currentOffset += spanLength;
        }
      }
      
      node = walker.nextNode();
    }
    
    // If we didn't find a position, place cursor at the end
    if (editor.lastChild) {
      if (editor.lastChild.nodeType === Node.TEXT_NODE) {
        range.setStart(editor.lastChild, editor.lastChild.textContent.length);
        range.setEnd(editor.lastChild, editor.lastChild.textContent.length);
      } else {
        range.setStartAfter(editor.lastChild);
        range.setEndAfter(editor.lastChild);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (e) {
    // Ignore cursor restoration errors
    console.warn('Failed to restore cursor position:', e);
  }
};

/**
 * Calculate cursor position in plain text from a selection range
 * @param {Range} range - The selection range
 * @param {HTMLElement} editor - The contentEditable element
 * @returns {number} The cursor position in plain text
 */
export const getCursorPosition = (range, editor) => {
  if (!range || !editor) return 0;
  
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
};

