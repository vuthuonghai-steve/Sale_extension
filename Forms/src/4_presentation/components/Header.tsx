import React from 'react';

interface HeaderProps {
  title: string;
  statusText?: string;
  statusType?: 'success' | 'info' | 'warning';
}

export const Header: React.FC<HeaderProps> = ({
  title,
  statusText = 'Ready (MV3)',
  statusType = 'success',
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--border-glass)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
        >
          F
        </div>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
      </div>

      <span className={`badge badge-${statusType}`}>{statusText}</span>
    </header>
  );
};
