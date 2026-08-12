import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, MapPin, Mail, Shield, Wallet, Plus, Save } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [newAddr, setNewAddr] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const updatedAddresses = [...(userProfile.addresses || [])];
    if (newAddr.trim()) {
      updatedAddresses.push({
        id: `addr-${Date.now()}`,
        name: 'Saved Address',
        phone,
        address: newAddr,
        city: 'Dhaka',
        area: 'Main',
      });
      setNewAddr('');
    }

    try {
      await updateUserProfile({ name: name.trim(), phone: phone.trim(), photoURL: photoURL.trim() || null, addresses: updatedAddresses });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (saveError) {
      console.error('Unable to save profile:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Account Profile</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage personal info, saved delivery addresses, and wallet</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-orange-500 text-white font-black text-2xl flex items-center justify-center mx-auto overflow-hidden">
            {photoURL ? (
              <img src={photoURL} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <h2 className="font-bold text-neutral-900 text-base">{userProfile.name}</h2>
            <p className="text-xs text-neutral-400">{userProfile.email}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-orange-100 text-orange-800 font-extrabold uppercase text-[10px]">
              Role: {userProfile.role}
            </span>
          </div>

          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-1">
            <p className="text-[10px] uppercase font-black text-orange-800">BM Food Delivery Wallet Balance</p>
            <p className="text-2xl font-black text-orange-600">৳{userProfile.walletBalance || 0}</p>
          </div>
        </div>

        {/* Right form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
          {saved && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">Profile updated successfully!</div>}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">{error}</div>}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Profile Avatar Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1">Add New Delivery Address</label>
              <input
                type="text"
                placeholder="House #, Road #, Area, City"
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Saved addresses */}
            {userProfile.addresses?.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="font-bold text-neutral-800">Saved Addresses:</p>
                {userProfile.addresses.map((a, idx) => (
                  <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
                    <p className="font-bold text-neutral-900">{a.name}</p>
                    <p>{a.address}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Updates'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
