import React, { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Coupon } from '../../types';
import { Plus, Edit2, Trash2, Tag, Percent, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface AdminCouponsTabProps {
  coupons: Coupon[];
  onRefresh: () => void;
}

export const AdminCouponsTab: React.FC<AdminCouponsTabProps> = ({ coupons, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [minimumOrder, setMinimumOrder] = useState<number>(200);
  const [maximumDiscount, setMaximumDiscount] = useState<number | ''>('');
  const [usageLimit, setUsageLimit] = useState<number | ''>(100);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [isActive, setIsActive] = useState(true);

  const openNew = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('fixed');
    setDiscountValue(100);
    setMinimumOrder(300);
    setMaximumDiscount('');
    setUsageLimit(500);
    setStartDate('2026-01-01');
    setEndDate('2026-12-31');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinimumOrder(c.minimumOrder);
    setMaximumDiscount(c.maximumDiscount ?? '');
    setUsageLimit(c.usageLimit ?? '');
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      alert("Please enter a valid coupon code.");
      return;
    }

    const couponData: Coupon = {
      id: editingCoupon ? editingCoupon.id : `coupon-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minimumOrder: Number(minimumOrder),
      maximumDiscount: maximumDiscount !== '' ? Number(maximumDiscount) : undefined,
      usageLimit: usageLimit !== '' ? Number(usageLimit) : undefined,
      usedCount: editingCoupon ? editingCoupon.usedCount : 0,
      startDate,
      endDate,
      isActive,
    };

    try {
      await setDoc(doc(db, 'coupons', couponData.id), couponData);
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save coupon.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteDoc(doc(db, 'coupons', id));
        onRefresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete coupon.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-neutral-900">Discount Coupons ({coupons.length})</h2>
          <p className="text-xs text-neutral-500">Manage promotional promo codes for checkout discounts.</p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition hover:bg-[var(--bm-ember-hover)] shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="p-4 border border-neutral-200 rounded-2xl space-y-3 relative bg-neutral-50/50">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-orange-100 text-orange-700 font-black px-2.5 py-1 rounded-lg text-sm tracking-wider uppercase inline-block">
                  {c.code}
                </span>
                <p className="text-xs font-bold text-neutral-800 mt-2">
                  {c.discountType === 'fixed' ? `৳${c.discountValue} Flat Discount` : `${c.discountValue}% Off`}
                  {c.maximumDiscount ? ` (Max ৳${c.maximumDiscount})` : ''}
                </p>
              </div>

              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1 text-neutral-500 hover:text-[var(--bm-ember-soft)]">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1 text-neutral-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 space-y-1 pt-2 border-t border-neutral-200">
              <p>Min Order Required: <strong className="text-neutral-900">৳{c.minimumOrder}</strong></p>
              <p>Usage: <strong className="text-neutral-900">{c.usedCount} / {c.usageLimit ?? '∞'} times</strong></p>
              <p className="text-[10px]">Valid: {c.startDate} to {c.endDate}</p>
            </div>

            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {c.isActive ? 'Active Promo' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="bm-modal-panel relative w-full max-w-md space-y-4 rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] z-10">
            <h3 className="text-base font-bold text-neutral-900">
              {editingCoupon ? 'Edit Promo Coupon' : 'Create New Coupon'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-black tracking-wider uppercase text-orange-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  >
                    <option value="fixed">Flat Amount (৳)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Discount Value ({discountType === 'fixed' ? '৳' : '%'}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-black text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Min Order Amount (৳)</label>
                  <input
                    type="number"
                    value={minimumOrder}
                    onChange={(e) => setMinimumOrder(Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Max Discount Cap (৳)</label>
                  <input
                    type="number"
                    placeholder="Optional cap"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Total allowed uses"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Coupon Active
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
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
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
