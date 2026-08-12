import React, { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Banner } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { Plus, Edit2, Trash2, Layout, Eye } from 'lucide-react';

interface AdminBannersTabProps {
  banners: Banner[];
  onRefresh: () => void;
}

export const AdminBannersTab: React.FC<AdminBannersTabProps> = ({ banners, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const openNew = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80');
    setLinkUrl('/restaurants');
    setSortOrder(banners.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setImageUrl(b.imageUrl);
    setLinkUrl(b.linkUrl || '');
    setSortOrder(b.sortOrder);
    setIsActive(b.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      alert("Please provide banner title and image URL.");
      return;
    }

    const bannerData: Banner = {
      id: editingBanner ? editingBanner.id : `banner-${Date.now()}`,
      title,
      subtitle,
      imageUrl,
      linkUrl,
      sortOrder: Number(sortOrder),
      isActive,
    };

    try {
      await setDoc(doc(db, 'banners', bannerData.id), bannerData);
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save banner.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this promotional banner?")) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        onRefresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete banner.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-neutral-900">Promotional Home Banners ({banners.length})</h2>
          <p className="text-xs text-neutral-500">Manage hero slider and promotional campaign graphics.</p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition hover:bg-[var(--bm-ember-hover)] shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((b) => (
          <div key={b.id} className="border border-neutral-200 rounded-2xl overflow-hidden space-y-3 bg-neutral-50/50">
            <div className="h-36 relative bg-neutral-200">
              <ImageWithFallback src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
              <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                b.isActive ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {b.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="p-4 pt-0 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm line-clamp-1">{b.title}</h4>
                  <p className="text-neutral-500 line-clamp-2">{b.subtitle}</p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(b)} className="p-1 text-neutral-500 hover:text-[var(--bm-ember-soft)]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1 text-neutral-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
              {editingBanner ? 'Edit Banner' : 'Create New Promotional Banner'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% OFF On First Kacchi Order"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Subtitle / Deal Details</label>
                <input
                  type="text"
                  placeholder="e.g. Use code WELCOME50 at checkout"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">External Banner Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
                {imageUrl && (
                  <div className="mt-2 h-20 rounded-xl overflow-hidden bg-neutral-100 border">
                    <ImageWithFallback src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Target Link URL</label>
                <input
                  type="text"
                  placeholder="/restaurant/rest-kacchi-express"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
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
                    Banner Active
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
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
