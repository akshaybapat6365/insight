'use client';

import React, { useState, useEffect } from 'react';

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
  autoHideDuration?: number; // in milliseconds
}

export function ErrorBanner({ 
  message, 
  onClose, 
  autoHideDuration = 5000 
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-800 text-white p-3 rounded-md shadow-md max-w-xs animate-fade-in">
      <div className="flex justify-between items-start">
        <p>{message}</p>
        <button 
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-3 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Animation for fade-in
const fadeInAnimation = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
`;

// Add animation to globals.css if not already there
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = fadeInAnimation;
  document.head.appendChild(style);
} 