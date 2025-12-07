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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '50px',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1>⚠️ Une erreur est survenue</h1>
          <p>L'application a rencontré une erreur.</p>
          <details style={{ textAlign: 'left', marginTop: '20px' }}>
            <summary>Détails de l'erreur</summary>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;