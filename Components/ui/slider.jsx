import React from 'react';

export function Slider({ 
  value = 0, 
  onChange,
  onValueChange,
  min = 0, 
  max = 100, 
  step = 1,
  className = '',
  orientation = 'horizontal',
  ...props 
}) {
  // Handle both onChange and onValueChange callbacks
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
    // Support shadcn style onValueChange with array format
    onValueChange?.([newValue]);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={Array.isArray(value) ? value[0] : value}
      onChange={handleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className}`}
    />
  );
}
