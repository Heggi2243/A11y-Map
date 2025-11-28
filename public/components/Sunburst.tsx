import React from 'react';

export const Sunburst: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full animate-[spin_20s_linear_infinite]"
        style={{ color: '#fcd34d' }} 
      >
        <defs>
          <mask id="circle-mask">
            <circle cx="100" cy="100" r="100" fill="white" />
          </mask>
        </defs>
        <g mask="url(#circle-mask)">
          {/* Generate sun rays */}
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d="M100 100 L200 80 L200 120 Z"
              fill="currentColor"
              transform={`rotate(${i * 30} 100 100)`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};