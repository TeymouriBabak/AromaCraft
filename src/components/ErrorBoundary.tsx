'use client';

import React from 'react';

type Props = { children: React.ReactNode; onError?: (err: Error) => void };

export default class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error?: Error }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.setState({ error });
    try {
      this.props.onError?.(error);
    } catch {
      // ignore
    }
    console.error('Captured error in ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Something went wrong while processing payment. Please refresh and try
          again.
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
