import React from 'react';

export default function StatsCard({
  title,
  value,
  icon,
  color = '#176B4D',
  subtitle,
  highlight = false
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: highlight ? `1px solid ${color}` : '1px solid #E3E7E4',
        borderRadius: '12px',
        padding: '1.2rem 1.35rem',
        boxShadow: highlight ? '0 2px 10px rgba(220, 38, 38, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.15s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: '140px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = highlight ? color : '#C2E2D3';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = highlight ? color : '#E3E7E4';
        e.currentTarget.style.boxShadow = highlight ? '0 2px 10px rgba(220, 38, 38, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.03)';
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.6rem'
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: '700',
              color: '#66716B',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </span>

          {icon && (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#F7F8F6',
                border: '1px solid #E3E7E4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {icon}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: '2.1rem',
            fontWeight: '800',
            color: '#17201C',
            lineHeight: '1.1',
            letterSpacing: '-0.03em'
          }}
        >
          {value}
        </div>
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #F0F3F1',
            fontSize: '0.74rem',
            color: '#66716B',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: '500'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: color,
              display: 'inline-block',
              flexShrink: 0
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}