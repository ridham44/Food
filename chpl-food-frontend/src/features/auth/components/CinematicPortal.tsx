import React from 'react';
import './CinematicPortal.css';

interface CinematicPortalProps {
  isActive: boolean;
}

export function CinematicPortal({ isActive }: CinematicPortalProps) {
  return (
    <span className={`cinematic-portal ${isActive ? 'is-entering' : ''}`} aria-hidden="true">
      <span className="portal-doorway">
        <span className="portal-interior" />
        <span className="portal-light" />
        <span className="portal-door" />
      </span>
      <span className="portal-walker">
        <svg
          className="portal-person"
          viewBox="0 0 18 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9" cy="5" r="4" fill="currentColor" />
          <path d="M9 10 L9 22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <g className="portal-limb portal-arm portal-arm-left">
            <path d="M9 12 L3.5 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g className="portal-limb portal-arm portal-arm-right">
            <path d="M9 12 L14.5 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g className="portal-limb portal-leg portal-leg-left">
            <path d="M9 21 L4.5 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g className="portal-limb portal-leg portal-leg-right">
            <path d="M9 21 L13.5 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </span>
    </span>
  );
}
