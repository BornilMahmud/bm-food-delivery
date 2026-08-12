import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Review } from '../../types';
import { Star, Eye, EyeOff, Search, Filter, MessageSquare } from 'lucide-react';

interface AdminReviewsTabProps {
  reviews: Review[];
  onRefresh: () => void;
}

export const AdminReviewsTab: React.FC<AdminReviewsTabProps> = ({ reviews, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.restaurantName && r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRating = ratingFilter === 'all' || String(r.rating) === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const handleToggleVisibility = async (review: Review) => {
    try {
      await updateDoc(doc(db, 'reviews', review.id), { isVisible: review.isVisible === false, moderatedAt: serverTimestamp() });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update review visibility.');
    }
  };

  return (
    <div className="bm-card p-5 sm:p-6 space-y-5">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-neutral-900">Customer Feedback & Reviews ({reviews.length})</h2>
          <p className="text-xs text-neutral-500">Monitor ratings, comments, and moderate customer reviews.</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search reviewer or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-8">No customer reviews found matching search.</p>
        ) : (
          filtered.map((rev) => (
            <div key={rev.id} className="rounded-2xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-3 sm:p-4 text-xs shadow-[var(--bm-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--bm-ember-hover)] hover:bg-[var(--bm-ember-wash)]">
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[var(--bm-cream)] text-sm">{rev.userName}</span>
                  <div className="flex text-[var(--bm-saffron)] font-bold" aria-label={`${rev.rating} out of 5 stars`}>
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                </div>

                <p className="line-clamp-2 max-w-3xl text-[var(--bm-ink-soft)] italic font-medium leading-5">"{rev.comment}"</p>

                <p className="text-[10px] text-[var(--bm-ink-soft)]">
                  Target: <strong className="text-[var(--bm-ember-soft)]">{rev.restaurantName || rev.foodName || 'Kitchen Item'}</strong> | Order #{rev.orderId?.slice(0, 8)}
                </p>
              </div>

              <div className="flex shrink-0 items-center justify-end sm:pl-4">
                <button
                  onClick={() => handleToggleVisibility(rev)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 ${rev.isVisible === false ? 'bg-[rgba(143,164,140,.14)] text-[var(--bm-basil)] hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]' : 'bg-[rgba(255,118,94,.13)] text-[var(--bm-error)] hover:bg-[var(--bm-ember-wash)] hover:text-[var(--bm-ember-soft)]'}`}
                >
                  {rev.isVisible === false ? <><Eye className="w-3.5 h-3.5" /> Restore</> : <><EyeOff className="w-3.5 h-3.5" /> Hide</>}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
