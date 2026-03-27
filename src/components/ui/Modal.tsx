'use client';

import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element and restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      // Small delay to allow animation to start before focusing
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      // Return focus to the element that opened the modal
      previousActiveElement.current?.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop with fade-in */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal content with scale-up animation */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative bg-white rounded-2xl shadow-xl w-full outline-none max-h-[90vh] flex flex-col',
          'animate-fade-in-scale',
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0 border-b border-gray-100">
          {title && <h2 id="modal-title" className="text-xl font-bold text-[#1e3a5f]">{title}</h2>}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="סגור חלון"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 pt-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
