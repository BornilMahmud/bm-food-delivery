import React, { useState } from 'react';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DeliveryRider } from '../../types';
import { Bike, Plus, Edit2, Trash2, CheckCircle, Ban, Star, DollarSign } from 'lucide-react';

interface AdminRidersTabProps {
  riders: DeliveryRider[];
  onRefresh: () => void;
}

export const AdminRidersTab: React.FC<AdminRidersTabProps> = ({ riders, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<DeliveryRider | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<'bike' | 'bicycle' | 'scooter'>('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [status, setStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [isApproved, setIsApproved] = useState(true);

  const openNew = () => {
    setEditingRider(null);
    setName('');
    setPhone('+8801700000000');
    setVehicleType('bike');
    setVehicleNumber('Dhaka Metro HA-1234');
    setStatus('available');
    setIsApproved(true);
    setModalOpen(true);
  };

  const openEdit = (r: DeliveryRider) => {
    setEditingRider(r);
    setName(r.name);
    setPhone(r.phone);
    setVehicleType(r.vehicleType);
    setVehicleNumber(r.vehicleNumber || '');
    setStatus(r.status);
    setIsApproved(r.isApproved);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Please enter rider name and phone number.");
      return;
    }

    const riderData: DeliveryRider = {
      id: editingRider ? editingRider.id : `rider-${Date.now()}`,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      status,
      totalDeliveries: editingRider ? editingRider.totalDeliveries : 0,
      rating: editingRider ? editingRider.rating : 5.0,
      walletEarnings: editingRider ? editingRider.walletEarnings : 0,
      isApproved,
    };

    try {
      await setDoc(doc(db, 'riders', riderData.id), riderData);
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save rider profile.");
    }
  };

  const handleToggleApproval = async (riderId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'riders', riderId), { isApproved: !currentStatus });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update approval status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this rider?")) {
      try {
        await deleteDoc(doc(db, 'riders', id));
        onRefresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete rider.");
      }
    }
  };

  return (
    <div className="bm-card p-5 sm:p-6 space-y-6">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-neutral-900">Delivery Hero Fleet ({riders.length})</h2>
          <p className="text-xs text-neutral-500">Manage express food delivery riders and active status.</p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition hover:bg-[var(--bm-ember-hover)] shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Delivery Rider
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {riders.map((r) => (
          <div key={r.id} className="min-w-0 rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-4 shadow-[var(--bm-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--bm-ember-hover)] hover:bg-[var(--bm-ember-wash)]">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(143,164,140,.15)] text-[var(--bm-basil)] font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="truncate text-sm font-extrabold text-[var(--bm-cream)]">{r.name}</h4>
                  <p className="text-[11px] text-[var(--bm-ink-soft)]">{r.phone}</p>
                </div>
              </div>

              <div className="flex gap-1">
                <button onClick={() => openEdit(r)} className="p-1 text-neutral-500 hover:text-[var(--bm-ember-soft)]">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="p-1 text-neutral-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 border-t border-[var(--bm-line)] pt-3 text-[11px] text-[var(--bm-ink-soft)]">
              <p>Vehicle: <strong className="text-[var(--bm-cream)] uppercase">{r.vehicleType}</strong> ({r.vehicleNumber || 'N/A'})</p>
              <p>Rating: <strong className="text-amber-600">★ {r.rating}</strong> | Completed: <strong className="text-[var(--bm-cream)]">{r.totalDeliveries} Jobs</strong></p>
              <p>Earnings: <strong className="text-[var(--bm-basil)]">৳{r.walletEarnings}</strong></p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--bm-line)] pt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                r.status === 'available' ? 'bg-[rgba(143,164,140,.15)] text-[var(--bm-basil)]' :
                r.status === 'busy' ? 'bg-[rgba(243,181,98,.15)] text-[var(--bm-saffron)]' : 'bg-[rgba(247,239,230,.08)] text-[var(--bm-ink-soft)]'
              }`}>
                {r.status}
              </span>

              <button
                onClick={() => handleToggleApproval(r.id, r.isApproved)}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${
                  r.isApproved ? 'bg-[rgba(143,164,140,.15)] text-[var(--bm-basil)] hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]' : 'bg-[rgba(255,118,94,.13)] text-[var(--bm-error)] hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'
                }`}
              >
                {r.isApproved ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                {r.isApproved ? 'Approved' : 'Pending Approval'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="bm-modal-panel relative w-full max-w-md space-y-4 rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] z-10">
            <h3 className="text-base font-bold text-neutral-900">
              {editingRider ? 'Edit Rider Profile' : 'Add New Delivery Rider'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Rider Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahim Uddin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+8801700112233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold uppercase"
                  >
                    <option value="bike">Motorcycle</option>
                    <option value="scooter">Scooter</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Plate Number</label>
                  <input
                    type="text"
                    placeholder="Dhaka Metro HA-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Rider Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  >
                    <option value="available">Available</option>
                    <option value="busy">On Delivery (Busy)</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                    />
                    Rider Approved
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl shadow-md transition hover:bg-[var(--bm-ember-hover)]"
                >
                  Save Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
