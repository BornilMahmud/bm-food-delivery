import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, UserRole, UserStatus } from '../../types';
import { Search, Shield, Ban, CheckCircle, Trash2, Eye, UserCheck } from 'lucide-react';

const PRIMARY_ADMIN_EMAIL = 'bornilmahmud56@gmail.com';

interface AdminUsersTabProps {
  users: UserProfile[];
  onRefresh: () => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    const user = users.find((item) => item.uid === userId);
    if (user?.email.toLowerCase() === PRIMARY_ADMIN_EMAIL && newRole !== 'admin') {
      alert('The primary BM Food administrator cannot be demoted from the admin panel.');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      onRefresh();
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Failed to update user role.");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus) => {
    const user = users.find((item) => item.uid === userId);
    if (user?.email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      alert('The primary BM Food administrator cannot be suspended from the admin panel.');
      return;
    }
    const newStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((item) => item.uid === userId);
    if (user?.email.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      alert('The primary BM Food administrator profile cannot be deleted from the admin panel.');
      return;
    }
    if (window.confirm("Are you sure you want to delete this user profile?")) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        onRefresh();
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900">User Management Directory</h2>
          <p className="text-xs text-neutral-500">Manage customers, admins, vendor kitchen owners, and riders.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
            <option value="restaurant">Restaurants</option>
            <option value="rider">Riders</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500 uppercase font-bold border-b border-neutral-200">
            <tr>
              <th className="p-3">User Details</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Wallet</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  No users found matching query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-[var(--bm-ember-wash)]">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{u.name}</p>
                        <p className="text-[10px] text-neutral-400">UID: {u.uid.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-neutral-800">{u.email}</p>
                    <p className="text-[10px] text-neutral-400">{u.phone}</p>
                  </td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole)}
                      className="p-1 bg-white border border-neutral-300 rounded-md font-bold text-xs uppercase"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="rider">Rider</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 font-black text-emerald-600">
                    ৳{u.walletBalance || 0}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="p-1.5 text-neutral-500 hover:text-[var(--bm-ember-soft)]"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.uid, u.status)}
                        className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          u.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                      >
                        {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.uid)}
                        className="p-1.5 text-neutral-400 hover:text-red-600"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="bm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedUser(null)} />
          <div className="bm-modal-panel relative w-full max-w-md space-y-4 rounded-3xl border border-[var(--bm-line)] bg-[var(--bm-graphite-raised)] p-6 text-[var(--bm-ink)] shadow-[var(--bm-shadow-deep)] z-10">
            <h3 className="text-base font-bold text-neutral-900">User Profile Summary</h3>

            <div className="space-y-2 text-xs text-neutral-700">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Role:</strong> <span className="uppercase font-bold text-orange-600">{selectedUser.role}</span></p>
              <p><strong>Status:</strong> {selectedUser.status}</p>
              <p><strong>Wallet Balance:</strong> ৳{selectedUser.walletBalance || 0}</p>
              
              <div className="pt-2 border-t">
                <p className="font-bold text-neutral-900 mb-1">Saved Addresses ({selectedUser.addresses?.length || 0}):</p>
                {selectedUser.addresses?.map((a) => (
                  <div key={a.id} className="p-2 bg-neutral-50 rounded-lg text-[11px] mb-1">
                    <p className="font-bold">{a.name} ({a.phone})</p>
                    <p className="text-neutral-500">{a.address}, {a.area}, {a.city}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
