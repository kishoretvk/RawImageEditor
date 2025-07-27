import React from 'react';

const SeamlessLoader = ({ 
  type = 'default', 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0 
}) => {
  const getLoaderStyle = () => {
    switch (type) {
      case 'invisible':
        return { display: 'none' };
      case 'minimal':
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
          zIndex: 9999,
          opacity: 0.8
        };
      case 'overlay':
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(2px)'
        };
      default:
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: '#666'
        };
    }
  };

  if (type === 'invisible') {
    return null;
  }

  if (type === 'minimal') {
    return (
      <div style={getLoaderStyle()}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)',
            transition: 'width 0.3s ease',
            borderRadius: '0 2px 2px 0'
          }}
        />
      </div>
    );
  }

  return (
    <div style={getLoaderStyle()}>
      <div style={{ textAlign: 'center' }}>
        {/* Elegant spinner */}
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #4CAF50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}
        />
        
        {/* Loading message */}
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontWeight: '500'
        }}>
          {message}
        </div>
        
        {/* Progress bar */}
        {showProgress && (
          <div style={{
            width: '200px',
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            margin: '12px auto 0',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SeamlessLoader;
