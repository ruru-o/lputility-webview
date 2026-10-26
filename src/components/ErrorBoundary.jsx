import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback winui-card" style={{
          padding: '32px',
          margin: '24px auto',
          maxWidth: '680px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ef4444',
          }}>
            <AlertTriangle size={28} />
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Something went wrong in this view
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            LPUtility prevented a blank page crash. You can safely reset the view or switch to another tool.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              className="winui-btn winui-btn-primary"
              onClick={this.handleReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} />
              Reset View
            </button>
            <button
              className="winui-btn winui-btn-subtle"
              onClick={() => window.location.reload()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Home size={15} />
              Reload App
            </button>
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left', fontSize: '0.75rem', color: '#f87171' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>View technical stack trace</summary>
              <pre style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
