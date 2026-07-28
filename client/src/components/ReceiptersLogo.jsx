import React from 'react';

export default function ReceiptersLogo({ className, ...props }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M40 30 L55 20 L80 20 L80 40 L65 40 L65 55 L50 70 L40 60 Z" fill="#3730A3" />
      <path d="M35 35 L45 42 L60 25 L60 45 L50 55 L50 75 L35 60 Z" fill="#FFFFFF" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />
      <path d="M35 35 L50 25 L75 25 L60 25 Z" fill="#4F46E5" />
      <path d="M75 25 L75 40 L60 40 L60 25 Z" fill="#4338CA" />
    </svg>
  );
}
