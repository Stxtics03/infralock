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

  const [setupData, setSetupData] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [successMsg, setSuccessMsg] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const handleEnable = async () => {
    clearMfaError();
    setLocalError('');
    const data = await enableMfa();
    if (data) {
      setSetupData(data);
      setPhase('setup');
    }
  };

  const handleVerify = async (code) => {
    clearMfaError();
    setLocalError('');
    try {
      const res = await fetch('/api/mfa/verify-setup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: code })
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalError(data.error || 'Invalid code. Please try again.');
        return;
      }
      setSetupData(prev => ({ ...prev, backupCodes: data.backupCodes }));
      setPhase('done');
      setSuccessMsg('MFA enabled successfully!');
      fetchMfaStatus();
    } catch (err) {
      setLocalError('Something went wrong. Please try again.');
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Disable MFA? This will reduce your account security.')) return;
    await disableMfa();
    setSetupData(null);
    setPhase('idle');
    setSuccessMsg('MFA has been disabled.');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Security Settings</h2>
      <p className="text-sm text-gray-500 mb-6">Manage two-factor authentication for your account.</p>

      {(mfaError || localError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
          {localError || mfaError}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 mb-4">
          {successMsg}
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700">Authenticator App (TOTP)</p>
          <p className="text-xs text-gray-400">Use Google Authenticator or Authy</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Phase: idle */}
      {phase === 'idle' && !mfaEnabled && (
        <button
          onClick={handleEnable}
          disabled={mfaLoading}
          className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm"
        >
          {mfaLoading ? 'Loading...' : 'Enable MFA'}
        </button>
      )}

      {/* Phase: setup — show QR code */}
      {phase === 'setup' && setupData && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app, then enter the 6-digit code below.
          </p>
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg border">
            <QRCodeSVG value={setupData.otpUri} size={160} />
          </div>
          <p className="text-xs text-gray-400 text-center break-all">
            Manual key: <span className="font-mono text-gray-600">{setupData.secret}</span>
          </p>
          <MfaCodeInput
            onChange={(code) => { if (code.length === 6) handleVerify(code); }}
            disabled={mfaLoading}
          />
        </div>
      )}

      {/* Phase: done — show backup codes */}
      {phase === 'done' && setupData?.backupCodes && (
        <div className="mt-4">
          <BackupCodesDisplay codes={setupData.backupCodes} />
        </div>
      )}

      {/* Already enabled — offer disable */}
      {mfaEnabled && phase !== 'setup' && (
        <button
          onClick={handleDisable}
          disabled={mfaLoading}
          className="mt-4 w-full border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm"
        >
          {mfaLoading ? 'Processing...' : 'Disable MFA'}
        </button>
      )}
    </div>
  );
}