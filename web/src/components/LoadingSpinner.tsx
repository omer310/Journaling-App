'use client';

import { RiLoader4Line } from 'react-icons/ri';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'medium', 
  text, 
  className = '',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <RiLoader4Line 
        className={`${sizeClasses[size]} animate-spin text-primary mb-2`} 
      />
      {text && (
        <p className={`${textSizeClasses[size]} text-text-secondary animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}


