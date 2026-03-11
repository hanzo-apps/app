import React from 'react';
import clsx from 'clsx';

interface KeyProps {
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Key: React.FC<KeyProps> = ({
  label,
  onClick,
  className,
  variant = 'default',
  size = 'md',
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center rounded transition-colors',
        'border font-mono',
        {
          // Size variants
          'px-1.5 py-0.5 text-xs': size === 'sm',
          'px-2 py-1 text-sm': size === 'md',
          'px-3 py-1.5 text-base': size === 'lg',
          // Color variants
          'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700':
            variant === 'default',
          'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 dark:border-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500':
            variant === 'primary',
          'border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600':
            variant === 'secondary',
        },
        className
      )}
    >
      {label}
    </button>
  );
};