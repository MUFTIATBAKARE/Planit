import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg
          xmlns="http://w3.org"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Circular background filled with your brand color */}
          <circle cx="16" cy="16" r="15" fill="#5A56E0" />
          
          {/* ListTodo Icon lines styled in solid white */}
          <g 
            transform="translate(4, 4)" 
            stroke="#ffffff" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="6" height="6" rx="1" fill="none" />
            <path d="m3 17 2 2 4-4" fill="none" />
            <path d="M13 6h8" />
            <path d="M13 12h8" />
            <path d="M13 18h8" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
