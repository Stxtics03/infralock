/**
 * frontend/src/components/BackupCodesDisplay.jsx
 *
 * Shown exactly once after MFA enable or regeneration.
 * Copy-all, print, and a required acknowledgement checkbox
 * that gates the "continue" button.
 */

import { useState } from 'react';

export default function BackupCodesDisplay({ codes, onAcknowledged }) {
  const [copied,  setCopied]  = useState(false);
  const [checked, setChecked] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function print() {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>INFRAlock Backup Codes</title></head>
      <body style="font-family:monospace;padding:2rem">
        <h2>INFRAlock MFA Backup Codes</h2>
        <p>Store these in a password manager. Each code can only be used once.</p>
        <ul style="list-style:none;padding:0">${codes.map(c => `<li style="font-size:1.2rem;margin:.5rem 0">${c}</li>`).join('')}</ul>
        <p style="color:grey;font-size:.8rem">Generated: ${new Date().toUTCString()}</p>
      </body></html>`);
    w.document.close();
    w.print();
  }

  return (
    <div className="space-y-5">
      {/* Warning */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="font-semibold text-amber-800 text-sm">Save these codes now</p>
          <p className="text-amber-700 text-xs mt-0.5">They will never be shown again. Each code is single-use.</p>
        </div>
      </div>

      {/* Code grid */}
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code, i) => (
          <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-md px-4 py-2 font-mono text-sm text-zinc-800 tracking-widest text-center">
            {code}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={copyAll} className="flex-1 border border-zinc-300 rounded-lg px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">
          {copied ? '✓ Copied!' : '📋 Copy all'}
        </button>
        <button onClick={print} className="flex-1 border border-zinc-300 rounded-lg px-4 py-2 text-sm hover:bg-zinc-50 transition-colors">
          🖨️ Print
        </button>
      </div>

      {/* Acknowledge */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-zinc-700">I have saved my backup codes in a secure location.</span>
      </label>

      <button
        onClick={onAcknowledged}
        disabled={!checked}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
      >
        I've saved my codes — continue
      </button>
    </div>
  );
}
