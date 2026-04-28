/**
 * Bottom Sheet - Drawer desde la parte inferior
 * 
 * Útil en mobile para filtros, acciones, menús
 * Swipe down para cerrar (opcional)
 * Click en overlay para cerrar
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Alturas en px donde "engancha" el sheet
  defaultSnap?: number; // Altura inicial
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  snapPoints = [200, 400],
  defaultSnap = 0,
  className = '',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Manejar drag
  const handleMouseDown = (e: React.MouseEvent) => {
    startYRef.current = e.clientY;
    if (sheetRef.current) {
      startHeightRef.current = sheetRef.current.offsetHeight;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!sheetRef.current) return;

    const diff = e.clientY - startYRef.current;
    const newHeight = startHeightRef.current - diff;

    if (newHeight > 0) {
      sheetRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (!sheetRef.current) return;

    const currentHeight = sheetRef.current.offsetHeight;
    const closest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight)
        ? curr
        : prev
    );

    if (currentHeight < 100) {
      onClose();
    } else {
      sheetRef.current.style.height = `${closest}px`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        aria-describedby="sheet-description"
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-slate-900
          rounded-t-2xl shadow-2xl
          flex flex-col
          max-h-[90vh]
          ${className}
        `}
        style={{
          height: snapPoints[defaultSnap] || snapPoints[0],
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Handle / Drag Area */}
        <div
          onMouseDown={handleMouseDown}
          className="flex-shrink-0 flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
          aria-label="Arrastra para ajustar"
        >
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2
                    id="sheet-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="sheet-description"
                    className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Cerrar"
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X size={20} aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * Hook para controlar el estado del Bottom Sheet
 */
export function useBottomSheet() {
  const [isOpen, setIsOpen] = React.useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
