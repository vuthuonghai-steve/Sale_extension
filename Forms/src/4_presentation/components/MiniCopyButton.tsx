import React, { useState } from 'react';

export interface MiniCopyButtonProps {
  readonly textToCopy: string;
  readonly label?: string;
  readonly className?: string;
  readonly onCopied?: () => void;
}

export const MiniCopyButton: React.FC<MiniCopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  className = '',
  onCopied,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopied(true);
      if (onCopied) onCopied();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignored
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        void handleCopy(e);
      }}
      title={copied ? 'Đã sao chép vào bộ nhớ tạm!' : `Sao chép ${label}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 shadow-sm select-none active:scale-95 cursor-pointer ${
        copied
          ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-1 ring-emerald-400'
          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 hover:shadow-md'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-bold">Đã chép!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 opacity-85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
