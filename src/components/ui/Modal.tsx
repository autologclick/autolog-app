'use client';

import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus trap: focus the modal on open
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = '';
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

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn('relative bg-white rounded-2xl shadow-xl w-full outline-none max-h-[90vh] flex flex-col', sizes[size])}
      >
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0 border-b border-gray-100">
          {title && <h2 id="modal-title" className="text-xl font-bold text-[#1e3a5f]">{title}</h2>}
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition" aria-label="סגור חלון">
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
