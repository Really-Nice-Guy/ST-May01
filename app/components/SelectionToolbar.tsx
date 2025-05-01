import React, { useState, useEffect } from 'react';

interface SelectionToolbarProps {
  position: { x: number; y: number } | null;
  selectedText: string;
  onClose: () => void;
  onExplain: (text: string) => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  selectedText,
  onClose,
  onExplain
}) => {
  // We receive viewport-relative x/y coords, so no extra adjustments needed

  if (!position || !selectedText.trim()) return null;

  const handleSearchWeb = () => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
    window.open(searchUrl, '_blank');
    onClose();
  };

  const handleExplain = () => {
    onExplain(selectedText);
    onClose();
  };

  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 shadow-lg rounded-md p-1 z-[9999] flex gap-1 border border-gray-200 dark:border-gray-700"
      style={{
        top: `${position.y}px`, // viewport relative
        left: `${position.x}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button 
        onClick={handleSearchWeb}
        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-800 dark:text-gray-200 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Search Web
      </button>
      <button 
        onClick={handleExplain}
        className="px-2 py-1 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Explain This
      </button>
    </div>
  );
};

export default SelectionToolbar; 