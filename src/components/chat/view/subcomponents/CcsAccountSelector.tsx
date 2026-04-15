import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { CcsProfile } from '../../../../types/app';

type CcsAccountSelectorProps = {
  accounts: CcsProfile[];
  selectedAccountId: string | null;
  onSelect: (accountId: string | null) => void;
};

export default function CcsAccountSelector({ accounts, selectedAccountId, onSelect }: CcsAccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) ?? null;
  const dotColor = selectedAccount?.color ?? null;

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const dropdown = dropdownRef.current;
    if (!trigger || !dropdown || typeof window === 'undefined') return;

    const triggerRect = trigger.getBoundingClientRect();
    const viewportPadding = window.innerWidth < 640 ? 12 : 16;
    const spacing = 8;
    const width = Math.min(window.innerWidth - viewportPadding * 2, 220);
    let left = triggerRect.left + triggerRect.width / 2 - width / 2;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));

    const measuredHeight = dropdown.offsetHeight || 0;
    const spaceBelow = window.innerHeight - triggerRect.bottom - spacing - viewportPadding;
    const spaceAbove = triggerRect.top - spacing - viewportPadding;
    const openBelow = spaceBelow >= Math.min(measuredHeight || 260, 260) || spaceBelow >= spaceAbove;
    const availableHeight = Math.min(
      window.innerHeight - viewportPadding * 2,
      Math.max(150, openBelow ? spaceBelow : spaceAbove),
    );
    const panelHeight = Math.min(measuredHeight || availableHeight, availableHeight);
    const top = openBelow
      ? Math.min(triggerRect.bottom + spacing, window.innerHeight - viewportPadding - panelHeight)
      : Math.max(viewportPadding, triggerRect.top - spacing - panelHeight);

    setDropdownStyle({ position: 'fixed', top, left, width, maxHeight: availableHeight, zIndex: 80 });
  }, []);

  useEffect(() => {
    if (!isOpen) { setDropdownStyle(null); return; }
    const rafId = window.requestAnimationFrame(updateDropdownPosition);
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      closeDropdown();
    };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDropdown(); };
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  // Don't render if there are no CCS accounts configured
  if (accounts.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (isOpen) { closeDropdown(); return; } setIsOpen(true); }}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 sm:h-10 sm:w-10 ${
          selectedAccount
            ? 'bg-accent/80 hover:bg-accent'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
        }`}
        title={selectedAccount ? `CCS: ${selectedAccount.displayName}` : 'CCS: Default account'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {/* Profile color dot */}
        <div className="relative flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5">
          <svg className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {dotColor && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background sm:h-2.5 sm:w-2.5 sm:border-2"
              style={{ backgroundColor: dotColor }}
            />
          )}
        </div>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle || { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
          className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
          role="dialog"
          aria-modal="false"
        >
          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">CCS Account</h3>
              <button
                type="button"
                onClick={closeDropdown}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose which account to use for new conversations.
            </p>
          </div>

          <div className="min-h-0 overflow-y-auto py-1">
            {/* Default option */}
            <button
              type="button"
              onClick={() => { onSelect(null); closeDropdown(); }}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedAccountId === null ? 'bg-gray-50 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                  <div className="h-3 w-3 rounded-full border-2 border-gray-400 dark:border-gray-500" />
                </div>
                <div>
                  <div className={`text-sm font-medium ${selectedAccountId === null ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    Default
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">~/.claude/ (no CCS)</div>
                </div>
                {selectedAccountId === null && (
                  <span className="ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    active
                  </span>
                )}
              </div>
            </button>

            {accounts.map(account => (
              <button
                key={account.id}
                type="button"
                onClick={() => { onSelect(account.id); closeDropdown(); }}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedAccountId === account.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: account.color ?? '#6b7280' }}
                    />
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${selectedAccountId === account.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {account.displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">~/.ccs/instances/{account.id}/</div>
                  </div>
                  {selectedAccountId === account.id && (
                    <span className="ml-auto rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      active
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
