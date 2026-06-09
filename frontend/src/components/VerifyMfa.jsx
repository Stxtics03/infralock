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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter the 6-digit code from your authenticator app.
        </p>
        {(error || mfaError) && (
          <p className="text-red-600 text-sm mb-4">{error || mfaError}</p>
        )}
        <MfaCodeInput
          onChange={(code) => { if (code.length === 6) handleVerify(code); }}
          disabled={mfaLoading}
        />
      </div>
    </div>
  );
}