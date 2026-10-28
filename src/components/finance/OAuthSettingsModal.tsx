import React, { useState } from 'react';
import { Globe, Check, Copy, Key, ShieldCheck, X } from 'lucide-react';
import { 
  getCustomOAuthClientId, 
  setCustomOAuthClientId, 
  setCachedGmailToken 
} from '../../services/gmail';

interface OAuthSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userKey?: string | null;
  onTokenUpdated?: () => void;
}

export const OAuthSettingsModal: React.FC<OAuthSettingsModalProps> = ({
  isOpen,
  onClose,
  userKey,
  onTokenUpdated
}) => {
  const [customClientIdInput, setCustomClientIdInput] = useState(getCustomOAuthClientId());
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomOAuthClientId(customClientIdInput.trim());
    onClose();
  };

  const handleApplyManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    setCachedGmailToken(manualTokenInput.trim(), userKey);
    onClose();
    onTokenUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121820] w-full max-w-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161d26]">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Globe size={18} />
            <span>Google OAuth & Domain Whitelist Guide</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-300">
          {/* Domain Whitelisting Box */}
          <div className="p-4 bg-[#0a0e14] rounded-2xl border border-slate-800 space-y-2">
            <div className="font-bold text-white flex items-center justify-between">
              <span>Your Current Hosting Origin / Domain</span>
              <button
                type="button"
                onClick={handleCopyOrigin}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                {copiedOrigin ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedOrigin ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-amber-300 font-mono text-[11px] block p-2 bg-[#141b24] rounded-xl border border-slate-800 select-all">
              {currentOrigin}
            </code>
            <p className="text-[11px] text-slate-400">
              If hosting on GitHub Pages (<code>{currentHostname}</code>), add this origin to <strong>Authorized JavaScript Origins</strong> in your Google Cloud Console OAuth 2.0 Client credentials.
            </p>
          </div>

          {/* Option 1: Custom Google Cloud OAuth Client ID */}
          <form onSubmit={handleSaveCustomClientId} className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Key size={14} className="text-amber-400" />
              <span>Google Cloud OAuth Client ID</span>
            </div>
            <p className="text-[11px] text-slate-400">
              The client ID used for client-side Google Identity Services. Leave blank to use the default applet client.
            </p>
            <input
              type="text"
              placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
              value={customClientIdInput}
              onChange={(e) => setCustomClientIdInput(e.target.value)}
              className="w-full bg-[#0a0e14] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setCustomClientIdInput('');
                  setCustomOAuthClientId('');
                }}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset to Default
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 cursor-pointer transition"
              >
                Save Client ID
              </button>
            </div>
          </form>

          {/* Option 2: Direct Bearer Token for Testing */}
          <form onSubmit={handleApplyManualToken} className="p-4 bg-[#141b24] rounded-2xl border border-slate-800 space-y-3">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Direct OAuth Token (Quick Test / Bypass)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Paste a temporary Google OAuth access token (e.g. from Google OAuth Playground) to immediately test email scanning without popup authentication.
            </p>
            <input
              type="password"
              placeholder="Paste access token (ya29....)"
              value={manualTokenInput}
              onChange={(e) => setManualTokenInput(e.target.value)}
              className="w-full bg-[#0a0e14] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 cursor-pointer transition"
              >
                Apply Token
              </button>
            </div>
          </form>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
