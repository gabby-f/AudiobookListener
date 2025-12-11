import React from 'react';

export function ScrollArea({ children, className = '', ...props }) {
  return (
    <div 
      className={`overflow-y-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
