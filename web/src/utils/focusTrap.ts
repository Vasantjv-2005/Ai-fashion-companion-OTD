import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(',');

export interface UseFocusTrapOptions {
  isOpen: boolean;
  isPaused?: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
  returnFocus?: boolean;
}

/**
 * Custom hook to manage keyboard focus trapping, Escape dismissal,
 * background scroll locking, and focus restoration for modal dialogs.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  isPaused = false,
  onClose,
  autoFocus = true,
  returnFocus = true,
}: UseFocusTrapOptions): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isPausedRef = useRef<boolean>(isPaused);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Remember the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // 2. Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 3. Move initial focus into the container after mounting
    const timer = setTimeout(() => {
      if (isPausedRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      if (autoFocus !== false) {
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(
          (el) =>
            el.offsetParent !== null ||
            el.offsetWidth > 0 ||
            el.offsetHeight > 0
        );

        if (focusables.length > 0) {
          const initialEl =
            focusables.find((el) => el.hasAttribute('autofocus')) ||
            focusables[0];
          initialEl.focus();
        } else {
          if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1');
          }
          container.focus();
        }
      }
    }, 20);

    // 4. Trap Tab and Shift+Tab + handle Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPausedRef.current) return;

      if (e.key === 'Escape' && onCloseRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      const currentContainer = containerRef.current;
      if (!currentContainer) return;

      const focusableEls = Array.from(
        currentContainer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (el) =>
          el.offsetParent !== null ||
          el.offsetWidth > 0 ||
          el.offsetHeight > 0
      );

      if (focusableEls.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: if on first element or outside container, cycle to last element
        if (
          document.activeElement === firstEl ||
          !currentContainer.contains(document.activeElement)
        ) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        // Tab: if on last element or outside container, cycle to first element
        if (
          document.activeElement === lastEl ||
          !currentContainer.contains(document.activeElement)
        ) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown, true);
      if (returnFocus !== false) {
        previousActiveElement.current?.focus?.();
      }
    };
  }, [isOpen, autoFocus, returnFocus]);

  return containerRef;
}
