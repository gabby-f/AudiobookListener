import React, { useState, useRef, useEffect } from 'react';

export function DropdownMenu({ children }) {
  return <div className="relative inline-block">{children}</div>;
}

export function DropdownMenuTrigger({ children, onClick, asChild, ...props }) {
  if (asChild) {
    return React.cloneElement(children, { onClick, ...props });
  }
  return <button onClick={onClick} {...props}>{children}</button>;
}

export function DropdownMenuContent({ children, className = '', ...props }) {
  return (
    <div 
      className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm"
      {...props}
    >
      {children}
    </button>
  );
}
