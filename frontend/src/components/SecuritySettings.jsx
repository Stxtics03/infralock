import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useStore from '../store';
import MfaCodeInput from './MfaCodeInput';
import BackupCodesDisplay from './BackupCodesDisplay';

export default function SecuritySettings() {
  const {
    mfaEnabled, mfaLoading, mfaError,
    fetchMfaStatus, enableMfa, disableMfa,
    clearMfaError, token
  } = useStore();

  const [setupData, setSetupData]   = useState(null);
  const [phase, setPhase]           = useState('idle');
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisablePrompt, setShowDisablePrompt] = useState(false);

  useEffect(() => { fetchMfaStatus(); }, []);

  const handleEnable = async () => {
    clearMfaError(); setLocalError('');
    const data = await enableMfa();
    if (data) { setSetupData(data); setPhase('setup'); }
  };

  const handleVerify = async (code) => {
    clearMfaError(); setLocalError('');
    try {
      const res = await fetch('/api/mfa/verify-setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code })
      });
      const data = await res.json();
      if (!res.ok) { setLocalError(data.error || 'Invalid code.'); return; }
      setSetupData(prev => ({ ...prev, backupCodes: data.backupCodes }));
      setPhase('done');
      setSuccessMsg('MFA enabled successfully!');
      fetchMfaStatus();
    } catch { setLocalError('Something went wrong.'); }
  };

  const handleDisableConfirm = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setLocalError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    clearMfaError(); setLocalError('');
    try {
      await disableMfa(disableCode);
      setSetupData(null);
      setPhase('idle');
      setDisableCode('');
      setShowDisablePrompt(false);
      setSuccessMsg('MFA has been disabled.');
    } catch (err) {
      setLocalError(err.message || 'Failed to disable MFA.');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg">
      <h2 className="text-lg font-semibold text-white mb-1">Security Settings</h2>
      <p className="text-sm text-gray-400 mb-6">Manage two-factor authentication for your account.</p>

      {(mfaError || localError) && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4">
          {localError || mfaError}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-2 mb-4">
          {successMsg}
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Authenticator App (TOTP)</p>
            <p className="text-xs text-gray-400">Google Authenticator or Authy</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border
          ${mfaEnabled
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
          {mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Phase: idle - not enabled */}
      {phase === 'idle' && !mfaEnabled && (
        <button onClick={handleEnable} disabled={mfaLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {mfaLoading ? 'Loading...' : 'Enable MFA'}
        </button>
      )}

      {/* Phase: setup - show QR */}
      {phase === 'setup' && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Scan this QR code with your authenticator app, then enter the 6-digit code below.
          </p>
          <div className="flex justify-center p-4 bg-white rounded-xl">
            <QRCodeSVG value={setupData.otpUri} size={160} />
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-500 mb-1">Manual key</p>
            <p className="text-xs font-mono text-gray-300 break-all">{setupData.secret}</p>
          </div>
          <MfaCodeInput
            onChange={(code) => { if (code.length === 6) handleVerify(code); }}
            disabled={mfaLoading}
          />
        </div>
      )}

      {/* Phase: done - show backup codes */}
      {phase === 'done' && setupData?.backupCodes && (
        <div className="mt-4">
          <BackupCodesDisplay codes={setupData.backupCodes} />
        </div>
      )}

      {/* Already enabled - disable flow */}
      {mfaEnabled && phase !== 'setup' && (
        <div className="mt-2">
          {!showDisablePrompt ? (
            <button onClick={() => { setShowDisablePrompt(true); setLocalError(''); setSuccessMsg(''); }}
              disabled={mfaLoading}
              className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              Disable MFA
            </button>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
              <p className="text-sm text-gray-300 font-medium">Confirm with your authenticator code</p>
              <p className="text-xs text-gray-500">Enter the current 6-digit code to disable MFA.</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disableCode}
                onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-center font-mono text-lg text-white tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDisablePrompt(false); setDisableCode(''); setLocalError(''); }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleDisableConfirm} disabled={mfaLoading || disableCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                  {mfaLoading ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}