import React, { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Category } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { Plus, Edit2, Trash2, Search, Tag, Eye } from 'lucide-react';

interface AdminCategoriesTabProps {
  categories: Category[];
  onRefresh: () => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({ categories, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openNew = () => {
    setEditingCat(null);
    setName('');
    setDesc('');
    setImageUrl('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCat(c);
    setName(c.name);
    setDesc(c.description);
    setImageUrl(c.imageUrl);
    setSortOrder(c.sortOrder);
    setIsActive(c.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) {
      alert("Please provide category name and external image URL.");
      return;
    }

    const catData: Category = {
      id: editingCat ? editingCat.id : `cat-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: desc,
      imageUrl,
      sortOrder: Number(sortOrder),
      isActive,
    };

    try {
      await setDoc(doc(db, 'categories', catData.id), catData);
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save category.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        onRefresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete category.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900">Food Categories ({categories.length})</h2>
          <p className="text-xs text-neutral-500">Organize food dishes into high-level menu categories.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
            />
          </div>

          <button
            onClick={openNew}
            className="px-4 py-2 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition hover:bg-[var(--bm-ember-hover)] shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div key={cat.id} className="p-4 border border-neutral-200 rounded-2xl flex gap-3 items-center">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
              <ImageWithFallback src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-neutral-900 truncate">{cat.name}</h4>
                <span className="text-[10px] text-neutral-400 font-bold">#{cat.sortOrder}</span>
              </div>
              <p className="text-neutral-500 line-clamp-1">{cat.description}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {cat.isActive ? 'Active' : 'Hidden'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <button onClick={() => openEdit(cat)} className="p-1 text-neutral-500 hover:text-[var(--bm-ember-soft)]">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1 text-neutral-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="bm-modal-panel relative w-full max-w-md space-y-4 rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] z-10">
            <h3 className="text-base font-bold text-neutral-900">
              {editingCat ? 'Edit Category' : 'Create New Category'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Kacchi & Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="A short description..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">External Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                />
                {imageUrl && (
                  <div className="mt-2 p-2 bg-neutral-50 rounded-xl border flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <ImageWithFallback src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">✓ Live Image Preview</span>
                  </div>
                )}
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
                    Category Active
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
