'use client';

import React from 'react';

interface LoaderProps {
  readonly text?: string;
  readonly className?: string;
}

export default function Loader({ text = 'Generating', className = '' }: LoaderProps) {
  const letters = text.split('');

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="gen-loader-wrapper">
        {letters.map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="gen-loader-letter"
            style={{ animationDelay: `${0.1 + index * 0.105}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
        <div className="gen-loader-overlay" />
      </div>
    </div>
  );
}
