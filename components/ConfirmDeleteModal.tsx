'use client';

import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  dangerous?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  dangerous = true,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white border-4 border-dark shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] max-w-md w-full animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 border-4 border-dark ${dangerous ? 'bg-alert-orange' : 'bg-cool-blue'}`}>
              <AlertTriangle size={32} className="text-dark" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-dark mb-2">{title}</h2>
              <p className="text-dark/80 mb-2">{message}</p>
              {itemName && (
                <div className="p-3 bg-bg-light border-2 border-dark/30 mt-3">
                  <p className="text-sm font-mono text-dark break-words">{itemName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          {dangerous && (
            <div className="mb-6 p-4 border-2 border-alert-orange bg-alert-orange/10">
              <p className="text-sm text-dark/80">
                <strong>⚠️ Warning:</strong> This action cannot be undone.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all font-bold"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel(); // Close modal after confirm
              }}
              className={`flex-1 px-6 py-3 border-4 border-dark font-bold transition-all ${
                dangerous
                  ? 'bg-alert-orange hover:bg-dark hover:text-white'
                  : 'bg-cool-blue hover:bg-dark hover:text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
