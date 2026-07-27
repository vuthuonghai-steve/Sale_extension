import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Sidepanel UI ErrorBoundary caught error]:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '24px 16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '8px',
            margin: '16px',
          }}
        >
          <h3 style={{ color: '#ff4d4f', margin: '0 0 8px 0', fontSize: '15px' }}>
            ⚠️ Đã xảy ra lỗi khi tải Sidepanel UI
          </h3>
          <p style={{ fontSize: '12px', color: '#595959', marginBottom: '12px' }}>
            {this.state.error?.message || 'Có lỗi không xác định.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#ff4d4f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
