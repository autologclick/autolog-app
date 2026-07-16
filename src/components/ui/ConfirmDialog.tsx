'use client';

/**
 * ConfirmDialog — accessible replacement for window.confirm().
 * Renders a small Modal with a message and confirm/cancel buttons.
 */

import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = 'אישור פעולה',
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
          className="w-full sm:w-auto"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
