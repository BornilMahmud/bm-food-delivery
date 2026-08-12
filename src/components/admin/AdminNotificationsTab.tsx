import React, { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppNotification } from '../../types';
import { Bell, Send, Trash2, Users, AlertCircle } from 'lucide-react';

interface AdminNotificationsTabProps {
  notifications: AppNotification[];
  onRefresh: () => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  notifications,
  onRefresh,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'customer' | 'restaurant' | 'rider'>('all');
  const [sending, setSending] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert("Please fill in notification title and message.");
      return;
    }

    setSending(true);

    const notifData: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: 'all',
      title,
      message,
      imageUrl: imageUrl || undefined,
      targetAudience,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'notifications', notifData.id), notifData);
      setTitle('');
      setMessage('');
      setImageUrl('');
      alert("Broadcast Notification published successfully!");
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this notification record?")) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
        onRefresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete notification.");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Broadcast Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" /> Broadcast System Alert
        </h2>

        <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">Target Audience *</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold uppercase"
            >
              <option value="all">Broadcast to All Users</option>
              <option value="customer">Customers Only</option>
              <option value="restaurant">Restaurant Owners Only</option>
              <option value="rider">Riders Only</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Notification Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 50% Off Flash Sale Live!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Message Content *</label>
            <textarea
              rows={3}
              required
              placeholder="Write broadcast message details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Optional Image Banner URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-[var(--bm-ember)] text-[var(--bm-ink-deep)] font-black rounded-xl shadow-md transition hover:bg-[var(--bm-ember-hover)] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Publish Broadcast Notification
          </button>
        </form>
      </div>

      {/* Sent History */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-neutral-900">Notification Logs ({notifications.length})</h2>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 border rounded-2xl flex items-start justify-between gap-4 text-xs bg-neutral-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-sm">{n.title}</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-bold text-[10px] uppercase">
                    {n.targetAudience || 'all'}
                  </span>
                </div>
                <p className="text-neutral-600">{n.message}</p>
                <p className="text-[10px] text-neutral-400">Sent: {new Date(n.createdAt).toLocaleString()}</p>
              </div>

              <button
                onClick={() => handleDeleteNotif(n.id)}
                className="p-1.5 text-neutral-400 hover:text-red-600 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
