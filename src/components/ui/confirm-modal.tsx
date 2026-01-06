"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger'
}: ConfirmModalProps) {
  const confirmButtonClass = variant === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white' 
    : variant === 'warning'
    ? 'bg-amber-500 hover:bg-amber-600 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center gap-4 text-center">
          <div className={`p-3 rounded-full ${
            variant === 'danger' ? 'bg-red-100 text-red-600' : 
            variant === 'warning' ? 'bg-amber-100 text-amber-600' : 
            'bg-blue-100 text-blue-600'
          }`}>
            <AlertCircle size={32} />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-[#606060]">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#f2f2f2] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#e5e5e5] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
