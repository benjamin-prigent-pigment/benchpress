import { useState, useRef, useEffect } from 'react';
import './DropdownButton.css';

function DropdownButton({ 
  label = 'Dropdown',
  items = [],
  onSelect,
  disabled = false,
  className = '',
  placeholder = 'Select an option',
  width
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setIsOpen(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const displayText = selectedItem ? (typeof selectedItem === 'string' ? selectedItem : selectedItem.label || selectedItem.value) : placeholder;

  const widthStyle = width ? { width: typeof width === 'number' ? `${width}px` : width } : {};

  return (
    <div className={`dropdown-button-container ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`btn-dropdown ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={widthStyle}
      >
        <span className="dropdown-label">{displayText}</span>
        <svg 
          className={`dropdown-chevron ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M2 4L6 8L10 4" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && items.length > 0 && (
        <div className="dropdown-menu" style={widthStyle}>
          {items.map((item, index) => {
            const itemValue = typeof item === 'string' ? item : item.value || item.label;
            const itemLabel = typeof item === 'string' ? item : item.label || item.value;
            const isSelected = selectedItem && (
              typeof selectedItem === 'string' 
                ? selectedItem === itemValue 
                : (selectedItem.value === itemValue || selectedItem.label === itemLabel)
            );

            return (
              <div
                key={index}
                className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
                role="option"
                aria-selected={isSelected}
              >
                {itemLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DropdownButton;
