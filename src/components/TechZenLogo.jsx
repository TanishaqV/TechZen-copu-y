import React from 'react';

export function TechZenIcon({ className = "w-10 h-10" }) {
  return (
    <img 
      src="/techzen-logo.png" 
      alt="TechZen Logo" 
      className={`object-contain ${className}`}
    />
  );
}

export function TechZenLogo({ showTagline = true, iconOnly = false, className = "", size = 36 }) {
  if (iconOnly) {
    return <TechZenIcon className={className || "w-10 h-10"} />;
  }

  const widthStyle = size ? { width: `${size}px`, height: `${size}px` } : {};

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="/techzen-logo.png"
        alt="TechZen Logo"
        style={widthStyle}
        className="w-10 h-10 object-contain drop-shadow-lg"
      />
    </div>
  );
}

export default TechZenLogo;
