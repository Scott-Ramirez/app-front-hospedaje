import React from 'react';

interface Props {
  className?: string;
}

export const SolesIcon: React.FC<Props> = ({ className = 'h-4 w-4' }) => {
  return (
    <span 
      className={`inline-flex items-center justify-center font-black font-sans select-none tracking-tighter shrink-0 ${className}`}
      style={{ fontSize: '0.75em', lineHeight: 1 }}
    >
      S/
    </span>
  );
};
