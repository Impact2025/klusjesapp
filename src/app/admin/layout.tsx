'use client';

import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {children}
    </div>
  );
}