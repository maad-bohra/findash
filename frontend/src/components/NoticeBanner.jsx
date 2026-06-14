// src/components/NoticeBanner.jsx
export default function NoticeBanner() {
  return (
    <div style={{
      background: 'var(--color-background-primary, #fff)',
      borderLeft: '3px solid #EF9F27',
      borderTop: '0.5px solid #e5e5e5',
      borderRight: '0.5px solid #e5e5e5',
      borderBottom: '0.5px solid #e5e5e5',
      borderRadius: '0 8px 8px 0',
      padding: '16px 20px',
      margin: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{
          background: '#FAEEDA',
          color: '#633806',
          fontSize: '11px',
          fontWeight: '500',
          padding: '3px 10px',
          borderRadius: '6px',
        }}>
          Beta
        </span>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
          This project is in active testing
        </p>
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
        Some features may not work correctly. This is deployed for testing purposes only — expect bugs, incomplete flows, and breaking changes. Feedback is welcome.
        For Feedbacks:205125054@nitt.edu
      </p>
    </div>
  );
}