import { useEffect, useRef } from 'react';

interface ScannerOptions {
  onScan: (barcode: string) => void;
  maxIntervalMs?: number;   // Maximum millisecond interval between keystrokes for hardware emulation
  minBarcodeLength?: number;
}

/**
 * Production-hardened hardware barcode scanner hook.
 * Discriminates between high-speed hardware HID keystrokes (<35ms) and human manual typing (>50ms).
 * Prevents active input collision when cashiers are manually entering amounts or notes.
 */
export function useBarcodeScanner({
  onScan,
  maxIntervalMs = 35,
  minBarcodeLength = 5
}: ScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const fastKeystrokeCountRef = useRef<number>(0);

  useEffect(() => {
    const isInteractiveInputElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tagName = el.tagName.toLowerCase();
      if (tagName === 'textarea' || (el as HTMLElement).isContentEditable) {
        return true;
      }
      if (tagName === 'input') {
        // If element explicitly opts in to scanner targeting
        if (el.getAttribute('data-scanner-target') === 'true') {
          return false;
        }
        const inputType = (el as HTMLInputElement).type.toLowerCase();
        return ['text', 'number', 'password', 'search', 'email', 'tel', 'url'].includes(inputType);
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInInteractiveInput = isInteractiveInputElement(activeEl);

      const now = performance.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Ignore functional modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
        return;
      }

      // Handle Terminal Enter (scanner suffix)
      if (e.key === 'Enter') {
        // Accept only if buffer meets length AND satisfied hardware timing
        if (
          bufferRef.current.length >= minBarcodeLength &&
          fastKeystrokeCountRef.current >= minBarcodeLength - 1
        ) {
          e.preventDefault();
          e.stopPropagation();

          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          fastKeystrokeCountRef.current = 0;

          // Clear corrupted input field if scanner leaked into a focused input
          if (isInInteractiveInput && activeEl instanceof HTMLInputElement) {
            activeEl.value = '';
            activeEl.blur();
          }

          onScan(scannedCode);
          return;
        }

        // Reset if human pressed enter
        bufferRef.current = '';
        fastKeystrokeCountRef.current = 0;
        return;
      }

      // Single printable character
      if (e.key.length === 1) {
        if (interval <= maxIntervalMs) {
          fastKeystrokeCountRef.current += 1;
        } else {
          fastKeystrokeCountRef.current = 0;
          bufferRef.current = '';
        }

        // If typing in a manual form input and interval exceeds hardware scanner timing, do not intercept
        if (isInInteractiveInput && interval > maxIntervalMs) {
          bufferRef.current = '';
          fastKeystrokeCountRef.current = 0;
          return;
        }

        bufferRef.current += e.key;

        // If hardware scanner is detected typing into an input, prevent input corruption
        if (isInInteractiveInput && fastKeystrokeCountRef.current >= 3) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, maxIntervalMs, minBarcodeLength]);
}
