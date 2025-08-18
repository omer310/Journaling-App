'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RiRefreshLine, RiErrorWarningLine } from 'react-icons/ri';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log error to monitoring service if available
    if (typeof window !== 'undefined') {
      try {
        // Could integrate with error reporting service here
        console.error('Application Error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      } catch (e) {
        console.error('Failed to log error:', e);
      }
    }
  }

  handleReload = () => {
    // Clear the error state and reload
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Optionally reload the page
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    // Just reset the error state without reloading
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <RiErrorWarningLine className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Something went wrong
              </h1>
              <p className="text-text-secondary mb-6">
                We're sorry, but something unexpected happened. You can try refreshing the page or going back to the dashboard.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <RiRefreshLine className="w-4 h-4" />
                Refresh Page
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 border border-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
              >
                Try Again
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// React Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Error caught by error handler:', error, errorInfo);
    
    // Could integrate with error reporting service
    if (typeof window !== 'undefined') {
      try {
        console.error('Application Error:', {
          error: error.message,
          stack: error.stack,
          ...errorInfo
        });
      } catch (e) {
        console.error('Failed to log error:', e);
      }
    }
  };
}
