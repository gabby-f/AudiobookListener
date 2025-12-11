import React from 'react';

export function Slider({ 
  value = 0, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className = '',
  ...props 
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange?.(parseFloat(e.target.value))}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
      {...props}
    />
  );
}
