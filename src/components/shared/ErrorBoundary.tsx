'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

/**
 * React Error Boundary for catching render errors
 * Shows a Hebrew error message with recovery options
 * Place in layouts to catch errors in child components
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 1. Report to Sentry with the React component stack as extra context.
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: { componentStack: errorInfo.componentStack },
      },
    });
    this.setState({ eventId });

    // 2. Also fire a direct email to the ops inbox. This is the primary
    //    alert channel — it doesn't depend on anyone watching Sentry.
    //    Fire-and-forget so a network failure here doesn't break the
    //    error UI we're trying to render.
    if (typeof window !== 'undefined') {
      fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'error-boundary',
          errorMessage: error.message || 'Unknown error',
          errorStack: error.stack || errorInfo.componentStack || '',
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          sentryEventId: eventId || undefined,
        }),
        keepalive: true, // ensure send completes even if the page navigates away
      }).catch(() => { /* never let alerting break the UI */ });
    }

    // 3. Local dev console for debugging.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Open Sentry's User Feedback dialog tied to the captured error.
   * Whatever the user writes here is attached to the Sentry issue —
   * so we go from "TypeError in component X" to "TypeError in X, user
   * was trying to upload a 12MB receipt photo from an iPhone".
   */
  handleReportBug = () => {
    if (!this.state.eventId) return;
    Sentry.showReportDialog({
      eventId: this.state.eventId,
      lang: 'he',
      title: 'ספר/י לנו מה ניסית לעשות',
      subtitle: 'הצוות יקבל את הדיווח יחד עם השגיאה הטכנית — זה יעזור לנו לתקן מהר.',
      subtitle2: '',
      labelName: 'שם',
      labelEmail: 'אימייל',
      labelComments: 'מה ניסית לעשות?',
      labelClose: 'סגור',
      labelSubmit: 'שלח דיווח',
      errorGeneric: 'אירעה שגיאה בשליחת הדיווח. נסה שוב.',
      errorFormEntry: 'יש שדות שלא מולאו כראוי. תקנ/י ונסה/י שוב.',
      successMessage: 'תודה! הדיווח התקבל. נטפל בזה בהקדם.',
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              אופס! משהו השתבש
            </h2>
            <p className="text-gray-600 mb-6">
              אירעה שגיאה בלתי צפויה. אפשר לנסות לרענן את הדף או לחזור לדף הבית.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                דף הבית
              </button>
              {this.state.eventId && (
                <button
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors font-medium"
                >
                  <MessageSquare className="w-4 h-4" />
                  ספר/י לנו מה קרה
                </button>
              )}
            </div>
            {this.state.eventId && (
              <p className="text-xs text-gray-400 mt-4">קוד שגיאה: {this.state.eventId.slice(0, 8)}</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
