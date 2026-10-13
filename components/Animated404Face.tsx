import React from 'react';

interface AnimatedFaceProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function Animated404Face({ className = '', size = 180, color = 'currentColor' }: AnimatedFaceProps) {
  return (
    <div className={`my-custom-face-container ${className}`}>
      <svg
        className="face"
        viewBox="0 0 320 380"
        style={{ width: `${size}px`, color }}
        aria-label="404 Animated Face Illustration"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={25}>
          <g className="face__eyes" transform="translate(0,112.5)">
            <g transform="translate(15,0)">
              <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
              <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
            </g>
            <g transform="translate(230,0)">
              <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
              <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
            </g>
          </g>
          <rect className="face__nose" x="132.5" y="112.5" width={55} height={155} rx={4} ry={4} />
          <g transform="translate(65,334)" strokeDasharray="102 102">
            <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
            <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
          </g>
        </g>
      </svg>
    </div>
  );
}
