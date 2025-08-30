'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text, 
  showProgress = false,
  progress = 0,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}></div>
        
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-medium text-primary ${sizeClasses[size] === 'h-12 w-12' ? 'text-sm' : 'text-xs'}`}>
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      
      {text && (
        <div className="mt-4 text-center">
          <p className={`font-medium text-text-primary ${textSizes[size]}`}>
            {text}
          </p>
          {showProgress && (
            <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


