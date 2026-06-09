/**
 * backend/utils/backupCodes.js
 *
 * Generates, hashes, and verifies MFA backup codes.
 *
 * Format: XXXX-XXXX (8 chars, dash in middle for readability)
 * Charset avoids ambiguous characters: 0/O and 1/I omitted.
 * Storage: SHA-256 hash only — plaintext is never written to DB.
 * Comparison: timing-safe to prevent timing-based enumeration.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import MfaCodeInput from './MfaCodeInput';

export default function VerifyMfa() {
  const { verifyMfa, mfaLoading, mfaError, clearMfaError } = useStore();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (code) => {
    clearMfaError();
    const ok = await verifyMfa(code);
    if (ok) {
      navigate('/');
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Two-Factor Auth</h1>
          <p className="text-sm text-gray-400 mt-1">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        {(error || mfaError) && (
          <p className="text-red-400 text-sm mb-4 text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
            {error || mfaError}
          </p>
        )}
        <MfaCodeInput
          onChange={(code) => { if (code.length === 6) handleVerify(code); }}
          disabled={mfaLoading}
        />
        {mfaLoading && (
          <p className="text-center text-cyan-400 text-sm mt-4 animate-pulse">Verifying…</p>
        )}
      </div>
    </div>
  );
}