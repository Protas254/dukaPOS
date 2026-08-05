import React from 'react';

// Renders the official Receipters logo SVG (same as /logo.svg) as a React component
export default function ReceiptersLogo({ className, style, ...props }) {
  return (
    <img
      src="/logo.svg"
      alt="Receipters Logo"
      className={className}
      style={style}
      {...props}
    />
  );
}
