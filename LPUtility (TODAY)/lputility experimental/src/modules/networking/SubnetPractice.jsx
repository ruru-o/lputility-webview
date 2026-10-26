import React from 'react';
import { BookOpen } from 'lucide-react';

export function SubnetPractice() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
          Subnet Practice
        </h2>
      </div>

      <div className="winui-card" style={{
        padding: '36px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)'
        }}>
          <BookOpen size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
            Subnet Practice
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            To be made by Alvarez
          </p>
        </div>
      </div>
    </div>
  );
}
