'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { storage, Group } from '@/lib/storage';
import CreateGroupModal from '@/components/CreateGroupModal';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Home() {
  const [groups, setGroups]         = useState<Group[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setGroups(storage.getGroups()); }, []);

  function createGroup(name: string) {
    const g: Group = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
    const next = [g, ...groups];
    storage.saveGroups(next);
    setGroups(next);
    setShowModal(false);
  }

  function pickAvatar(groupId: string) {
    setEditingId(groupId);
    fileRef.current?.click();
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = groups.map(g =>
        g.id === editingId ? { ...g, avatar: reader.result as string } : g
      );
      storage.saveGroups(next);
      setGroups(next);
      setEditingId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <header className="px-6 pt-10 pb-6 max-w-2xl mx-auto">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">seeyou</h1>
            <p className="text-blue-300 text-sm mt-1">Plan together. Show up together.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            <span className="text-lg leading-none">+</span>
            New group
          </button>
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto pb-16">
        {groups.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-white text-xl font-bold mb-2">No groups yet</h2>
            <p className="text-blue-300 text-sm mb-6">Create your first friend group and start planning.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Create a group
            </button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4">Your groups</p>
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 transition-all group">
                {/* Avatar — click to change */}
                <button
                  onClick={() => pickAvatar(g.id)}
                  className="w-12 h-12 rounded-xl shrink-0 overflow-hidden relative group/av"
                  title="Change group photo"
                >
                  {g.avatar ? (
                    <img src={g.avatar} alt={g.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/av:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Edit
                  </div>
                </button>

                <Link href={`/group/${g.id}`} className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{g.name}</p>
                    <p className="text-blue-300 text-xs mt-0.5">Created {fmtDate(g.createdAt)}</p>
                  </div>
                  <span className="text-blue-300 group-hover:text-white text-lg transition-colors shrink-0">›</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Hidden file input for avatar upload */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />

      {showModal && (
        <CreateGroupModal onCreate={createGroup} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
