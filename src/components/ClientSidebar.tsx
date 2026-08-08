"use client";

import Link from 'next/link';
import React from 'react';
import useUser from '@/hooks/useUser';
import { useAuth } from '@/components/auth-context';

export default function ClientSidebar() {
  const { user, loading } = useUser();
  const { logout } = useAuth();

  return (
    <div className="rounded-2xl bg-[#1A120B]/6 p-4 text-sm text-[#2C1D11]">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-[#1A120B] text-white flex items-center justify-center">
          {loading ? '…' : (user?.username || user?.firstName || 'U').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold">{loading ? 'Loading…' : (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest')}</div>
          <div className="text-xs text-[#6e4b33]">{user?.role || 'Customer'}</div>
        </div>
      </div>
      <nav className="mt-4 space-y-2">
        <Link href="/" className="block rounded px-3 py-2 hover:bg-[#f4efe6]">Home</Link>
        <Link href="/shop" className="block rounded px-3 py-2 hover:bg-[#f4efe6]">Shop</Link>
        <Link href="/quiz" className="block rounded px-3 py-2 hover:bg-[#f4efe6]">Coffee Finder</Link>
        <Link href="/dashboard/customer" className="block rounded px-3 py-2 hover:bg-[#f4efe6]">Purchase History</Link>
        <button
          onClick={() => void logout()}
          className="mt-3 w-full rounded bg-[#1A120B] py-2 text-sm text-white"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}
