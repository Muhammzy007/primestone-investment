import React from 'react';

function AppMinimal() {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      backgroundColor: '#e6f2ff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#1e3a8a', fontSize: '48px', marginBottom: '20px' }}>PrimeStone Investment</h1>
      <p style={{ color: '#2563eb', fontSize: '24px' }}>Minimal Test Page</p>
      <p style={{ color: '#4b5563', marginTop: '20px' }}>If you can see this, React is working!</p>
    </div>
  );
}

export default AppMinimal;
