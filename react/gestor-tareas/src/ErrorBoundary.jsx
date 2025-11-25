import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5',
          padding: '20px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#f44336', marginBottom: '20px' }}>
              ⚠️ Ocurrió un error
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Algo salió mal. Por favor, recarga la página.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                background: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;



