import React, { useState, useEffect, useRef } from 'react';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  onClose,
  selectedText
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedText) {
      setExplanation('');
      setIsLoading(true);
      fetchExplanation();
    }
  }, [isOpen, selectedText]);

  const fetchExplanation = async () => {
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!res.ok) {
        throw new Error('Failed to get explanation');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedExplanation = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        
        chunk.split('\n\n').forEach(line => {
          if (line.startsWith('data: ')) {
            const payload = line.replace(/^data: /, '').trim();
            if (payload === '[DONE]') {
              done = true;
            } else {
              try {
                const parsed = JSON.parse(payload);
                const delta = parsed.choices[0].delta.content;
                if (delta) {
                  accumulatedExplanation += delta;
                  setExplanation(accumulatedExplanation);
                }
              } catch (error) {
                console.error('Error parsing chunk:', error);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setExplanation('Sorry, I had trouble explaining that. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">Simple Explanation</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-gray-100 dark:bg-gray-700 p-3 mb-4 rounded text-sm max-h-[100px] overflow-y-auto">
            <p className="font-medium text-xs text-gray-500 mb-1">Selected text:</p>
            <p className="italic text-gray-700 dark:text-gray-300">{selectedText}</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {explanation.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal; 