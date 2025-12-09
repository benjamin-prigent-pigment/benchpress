import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for autocomplete functionality
 */
export const useAutocomplete = (components, componentsMap, editorRef) => {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  
  // Store cursor position and placeholder info when autocomplete is shown
  const autocompleteContextRef = useRef({
    cursorPosition: 0,
    placeholderStart: 0,
    textAtShow: ''
  });

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editorRef.current && !editorRef.current.contains(event.target) &&
          !event.target.closest('.autocomplete-dropdown')) {
        setShowAutocomplete(false);
      }
    };

    if (showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAutocomplete, editorRef]);

  /**
   * Build autocomplete options (components and their split parts)
   */
  const buildAutocompleteOptions = () => {
    const options = [];
    const query = autocompleteQuery.toLowerCase();
    
    // Check if query contains a slash (we're typing after component name)
    const slashIndex = query.indexOf('/');
    if (slashIndex !== -1) {
      // User is typing a split part
      const componentName = query.substring(0, slashIndex);
      const partQuery = query.substring(slashIndex + 1);
      const component = componentsMap[componentName];
      
      if (component && component.isSplit && component.splitParts) {
        // Show matching parts
        component.splitParts.forEach(part => {
          if (part.toLowerCase().includes(partQuery)) {
            options.push({
              type: 'split-part',
              component: component,
              part: part,
              displayName: `${component.name}/${part}`,
              fullName: `${component.name}/${part}`
            });
          }
        });
      }
    } else {
      // User is typing a component name
      components.forEach(comp => {
        if (comp.name.toLowerCase().includes(query)) {
          if (comp.isSplit && comp.splitParts) {
            // For split components, show each part as a separate option
            comp.splitParts.forEach(part => {
              options.push({
                type: 'split-part',
                component: comp,
                part: part,
                displayName: `${comp.name}/${part}`,
                fullName: `${comp.name}/${part}`
              });
            });
          } else {
            // Regular component
            options.push({
              type: 'component',
              component: comp,
              displayName: comp.name,
              fullName: comp.name
            });
          }
        }
      });
    }
    
    return options;
  };

  const filteredComponents = buildAutocompleteOptions();

  return {
    showAutocomplete,
    setShowAutocomplete,
    autocompleteQuery,
    setAutocompleteQuery,
    autocompletePosition,
    setAutocompletePosition,
    selectedAutocompleteIndex,
    setSelectedAutocompleteIndex,
    filteredComponents,
    autocompleteContextRef
  };
};

