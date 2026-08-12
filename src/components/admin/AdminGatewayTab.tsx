import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Globe2, KeyRound, Save, ShieldCheck, Webhook, Zap } from 'lucide-react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SystemSettings } from '../../types';

const GATEWAY_PROVIDERS = [
  { value: 'none', label: 'Not configured' },
  { value: 'sslcommerz', label: 'SSLCOMMERZ' },
  { value: 'aamarpay', label: 'aamarPay' },
  { value: 'shurjopay', label: 'shurjoPay' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'custom', label: 'Custom API' },
] as const;

type GatewayProvider = typeof GATEWAY_PROVIDERS[number]['value'];

type GatewayConfig = {
  provider: GatewayProvider;
  mode: 'test' | 'live';
  apiBaseUrl: string;
  publicKey: string;
  webhookUrl: string;
  enabled: boolean;
};

const EMPTY_GATEWAY: GatewayConfig = {
  provider: 'none',
  mode: 'test',
  apiBaseUrl: '',
  publicKey: '',
  webhookUrl: '',
  enabled: false,
};

interface AdminGatewayTabProps {
  onRefresh: () => void;
}

export const AdminGatewayTab: React.FC<AdminGatewayTabProps> = ({ onRefresh }) => {
  const [config, setConfig] = useState<GatewayConfig>(EMPTY_GATEWAY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGateway = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        const data = snap.exists() ? snap.data() : {};
        setConfig({
          provider: GATEWAY_PROVIDERS.some((provider) => provider.value === data.gatewayProvider) ? data.gatewayProvider : 'none',
          mode: data.gatewayMode === 'live' ? 'live' : 'test',
          apiBaseUrl: String(data.gatewayApiBaseUrl || ''),
          publicKey: String(data.gatewayPublicKey || ''),
          webhookUrl: String(data.gatewayWebhookUrl || ''),
          enabled: data.onlineGatewayEnabled === true,
        });
      } catch (loadError) {
        console.error('Unable to load gateway configuration:', loadError);
        setError('Gateway configuration could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    void loadGateway();
  }, []);

  const update = <K extends keyof GatewayConfig>(key: K, value: GatewayConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
    setNotice(null);
    setError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        gatewayProvider: config.provider,
        gatewayMode: config.mode,
        gatewayApiBaseUrl: config.apiBaseUrl.trim(),
        gatewayPublicKey: config.publicKey.trim(),
        gatewayWebhookUrl: config.webhookUrl.trim(),
        onlineGatewayEnabled: config.enabled,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setNotice('Gateway settings saved.');
      onRefresh();
    } catch (saveError) {
      console.error('Unable to save gateway configuration:', saveError);
      setError('Gateway settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bm-card p-8 text-sm font-bold text-[var(--bm-ink-soft)]">Loading gateway workspace…</div>;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="bm-card overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="bm-eyebrow flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> Gateway</div>
            <h2 className="bm-display mt-2 text-3xl text-[var(--bm-ink)]">Payment connection</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bm-ink-soft)]">Connect the provider metadata here. Secret credentials stay server-side.</p>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] ${config.enabled && config.provider !== 'none' ? 'border-[var(--bm-basil)]/40 bg-[var(--bm-basil)]/10 text-[var(--bm-basil)]' : 'border-[var(--bm-line)] bg-[var(--bm-paper-muted)] text-[var(--bm-ink-soft)]'}`}>
            {config.enabled && config.provider !== 'none' ? 'Enabled' : 'Standby'}
          </span>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-extrabold text-[var(--bm-ink)]">Provider<select value={config.provider} onChange={(event) => update('provider', event.target.value as GatewayProvider)} className="mt-2 w-full rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-muted)] px-3 py-3 text-sm font-bold text-[var(--bm-ink)] outline-none transition focus:border-[var(--bm-ember)]"><option value="none">Not configured</option><option value="sslcommerz">SSLCOMMERZ</option><option value="aamarpay">aamarPay</option><option value="shurjopay">shurjoPay</option><option value="stripe">Stripe</option><option value="custom">Custom API</option></select></label>
          <label className="text-xs font-extrabold text-[var(--bm-ink)]">Environment<select value={config.mode} onChange={(event) => update('mode', event.target.value as GatewayConfig['mode'])} className="mt-2 w-full rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-muted)] px-3 py-3 text-sm font-bold text-[var(--bm-ink)] outline-none transition focus:border-[var(--bm-ember)]"><option value="test">Test / sandbox</option><option value="live">Live production</option></select></label>
          <label className="text-xs font-extrabold text-[var(--bm-ink)] sm:col-span-2"><span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-[var(--bm-ember)]" /> API base URL</span><input type="url" value={config.apiBaseUrl} onChange={(event) => update('apiBaseUrl', event.target.value)} placeholder="https://api.provider.com" className="mt-2 w-full rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-muted)] px-3 py-3 text-sm font-medium text-[var(--bm-ink)] outline-none transition placeholder:text-[var(--bm-ink-soft)] focus:border-[var(--bm-ember)]" /></label>
          <label className="text-xs font-extrabold text-[var(--bm-ink)]"><span className="flex items-center gap-2"><KeyRound className="h-3.5 w-3.5 text-[var(--bm-saffron)]" /> Public key / merchant ID</span><input value={config.publicKey} onChange={(event) => update('publicKey', event.target.value)} placeholder="Public identifier only" className="mt-2 w-full rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-muted)] px-3 py-3 text-sm font-medium text-[var(--bm-ink)] outline-none transition placeholder:text-[var(--bm-ink-soft)] focus:border-[var(--bm-ember)]" /></label>
          <label className="text-xs font-extrabold text-[var(--bm-ink)]"><span className="flex items-center gap-2"><Webhook className="h-3.5 w-3.5 text-[var(--bm-basil)]" /> Webhook URL</span><input type="url" value={config.webhookUrl} onChange={(event) => update('webhookUrl', event.target.value)} placeholder="https://your-domain/api/payments/webhook" className="mt-2 w-full rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-muted)] px-3 py-3 text-sm font-medium text-[var(--bm-ink)] outline-none transition placeholder:text-[var(--bm-ink-soft)] focus:border-[var(--bm-ember)]" /></label>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-paper-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--bm-basil)]" /><div><p className="text-sm font-extrabold text-[var(--bm-ink)]">Allow online checkout</p><p className="mt-1 text-xs leading-5 text-[var(--bm-ink-soft)]">Enable only after the server adapter and webhook are ready.</p></div></div>
          <input type="checkbox" checked={config.enabled} onChange={(event) => update('enabled', event.target.checked)} className="h-5 w-5 accent-[var(--bm-ember)]" />
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[var(--bm-ember)]/20 bg-[var(--bm-ember)]/06 p-4 text-xs leading-5 text-[var(--bm-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <span>Secret API keys are never stored by this browser panel. Add them to the server environment and connect the webhook before going live.</span>
          <a className="inline-flex shrink-0 items-center gap-1 font-extrabold text-[var(--bm-ember)] transition hover:text-[var(--bm-saffron)]" href="https://firebase.google.com/docs/functions/config-env" target="_blank" rel="noreferrer">Server setup <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>

        {(notice || error) && <div className={`mt-5 flex items-center gap-2 rounded-2xl border p-3 text-xs font-extrabold ${error ? 'border-[var(--bm-error)]/30 bg-[var(--bm-error)]/10 text-[var(--bm-error)]' : 'border-[var(--bm-basil)]/30 bg-[var(--bm-basil)]/10 text-[var(--bm-basil)]'}`}><CheckCircle2 className="h-4 w-4" />{error || notice}</div>}

        <div className="mt-6 flex justify-end border-t border-[var(--bm-line)] pt-5"><button type="submit" disabled={saving} className="bm-button disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save gateway'}</button></div>
      </div>
    </form>
  );
};
