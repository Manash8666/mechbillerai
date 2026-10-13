'use client';

import React from 'react';

interface PearlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children?: React.ReactNode;
  readonly showStars?: boolean;
}

export default function PearlButton({
  children,
  showStars = true,
  className = '',
  ...props
}: PearlButtonProps) {
  return (
    <button className={`pearl-btn ${className}`} {...props}>
      <div className="pearl-wrap">
        <div className="pearl-content">
          {showStars && (
            <>
              <span className="pearl-star-idle">✧</span>
              <span className="pearl-star-hover">✦</span>
            </>
          )}
          {children || 'Pearl Button'}
        </div>
      </div>
    </button>
  );
}
