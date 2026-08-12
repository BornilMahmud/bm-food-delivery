import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SystemSettings } from '../../types';
import { Settings, Save, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

const EMPTY_SETTINGS: SystemSettings = {
  id: 'general', businessName: '', logoUrl: '', contactPhone: '', contactEmail: '', currency: '৳', taxPercentage: 0, defaultDeliveryFee: 0, minimumOrder: 0, codEnabled: false, manualPaymentsEnabled: false, onlineGatewayEnabled: false, orderCancellationWindowMinutes: 10, rewardPointsRate: 1, referralReward: 0, platformCommissionPercentage: 0,
};

interface AdminSettingsTabProps {
  onRefresh: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ onRefresh }) => {
  const [settings, setSettings] = useState<SystemSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) {
          setSettings(snap.data() as SystemSettings);
        }
      } catch (err) {
        console.warn("Using default settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save system settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-100 shadow-xs space-y-6 max-w-4xl">
      
      <div>
        <h2 className="text-xl font-black text-neutral-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-600" /> Platform System Settings
        </h2>
        <p className="text-xs text-neutral-500 mt-1">Configure general business information, taxes, delivery fees, and active payment modes.</p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Settings updated successfully! Changes persist live to customer application.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Business Branding */}
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-900 border-b pb-2 text-sm">1. Branding & Support Contact</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Support Phone *</label>
              <input
                type="tel"
                required
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Support Email *</label>
              <input
                type="email"
                required
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Currency & Charges */}
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-900 border-b pb-2 text-sm">2. Financials & Delivery Rates</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-black text-orange-600"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">VAT / Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxPercentage}
                onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Default Delivery Fee (৳)</label>
              <input
                type="number"
                value={settings.defaultDeliveryFee}
                onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Minimum Order (৳)</label>
              <input
                type="number"
                value={settings.minimumOrder}
                onChange={(e) => setSettings({ ...settings, minimumOrder: Number(e.target.value) })}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        {/* Operations & loyalty */}
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-900 border-b pb-2 text-sm">3. Operations, Loyalty & Commission</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block font-bold text-neutral-700">Cancellation window (minutes)<input type="number" min="0" value={settings.orderCancellationWindowMinutes ?? 10} onChange={(e) => setSettings({ ...settings, orderCancellationWindowMinutes: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl" /></label>
            <label className="block font-bold text-neutral-700">Reward points per ৳1<input type="number" min="0" step="0.1" value={settings.rewardPointsRate ?? 1} onChange={(e) => setSettings({ ...settings, rewardPointsRate: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl" /></label>
            <label className="block font-bold text-neutral-700">Referral reward (৳)<input type="number" min="0" value={settings.referralReward ?? 50} onChange={(e) => setSettings({ ...settings, referralReward: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl" /></label>
            <label className="block font-bold text-neutral-700">Platform commission (%)<input type="number" min="0" max="100" value={settings.platformCommissionPercentage ?? 10} onChange={(e) => setSettings({ ...settings, platformCommissionPercentage: Math.min(100, Math.max(0, Number(e.target.value))) })} className="mt-1 w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl" /></label>
          </div>
        </div>

        {/* Payment Gateways Toggles */}
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-900 border-b pb-2 text-sm">4. Enabled Checkout Payment Channels</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="p-4 border rounded-2xl flex items-center justify-between cursor-pointer bg-neutral-50 transition hover:bg-[var(--bm-ember-wash)]">
              <span className="font-bold text-neutral-800">Cash on Delivery (COD)</span>
              <input
                type="checkbox"
                checked={settings.codEnabled}
                onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
              />
            </label>

            <label className="p-4 border rounded-2xl flex items-center justify-between cursor-pointer bg-neutral-50 transition hover:bg-[var(--bm-ember-wash)]">
              <span className="font-bold text-neutral-800">bKash / Nagad Manual Tx</span>
              <input
                type="checkbox"
                checked={settings.manualPaymentsEnabled}
                onChange={(e) => setSettings({ ...settings, manualPaymentsEnabled: e.target.checked })}
                className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
              />
            </label>

            <label className="p-4 border rounded-2xl flex items-center justify-between cursor-pointer bg-neutral-50 transition hover:bg-[var(--bm-ember-wash)]">
              <span className="font-bold text-neutral-800">Online API Gateway</span>
              <input
                type="checkbox"
                checked={settings.onlineGatewayEnabled}
                onChange={(e) => setSettings({ ...settings, onlineGatewayEnabled: e.target.checked })}
                className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
              />
            </label>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-black rounded-xl shadow-lg transition hover:bg-[var(--bm-ember-hover)] flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>

      </form>

    </div>
  );
};
