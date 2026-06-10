/**
 * frontend/src/components/MfaCodeInput.jsx
 *
 * Six individual digit boxes for TOTP entry.
 * - Auto-advances to next box on digit input
 * - Backspace moves to previous box
 * - Paste of a full 6-digit code fills all boxes
 * - Calls onChange(fullCode) whenever any digit changes
 */

import { useRef, useState } from 'react';

export default function MfaCodeInput({ onChange, disabled = false, hasError = false }) {
  const [digits, setDigits] = useState(Array(6).fill(''));
  const refs = useRef([]);

  const base    = 'w-11 h-14 border-2 rounded-lg text-center text-xl font-mono font-bold outline-none transition-colors disabled:opacity-50 text-gray-900';
  const normal  = 'border-zinc-600 focus:border-indigo-500 bg-gray-800 text-white caret-white';
  const errored = 'border-red-400 bg-red-50 text-gray-900';

  function update(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    onChange(next.join(''));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next   = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    onChange(next.join(''));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          autoFocus={i === 0}
          autoComplete="one-time-code"
          className={`${base} ${hasError ? errored : normal}`}
        />
      ))}
    </div>
  );
}