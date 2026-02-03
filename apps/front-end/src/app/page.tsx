'use client';

import { useEffect, useState } from 'react';
import JobSeekerHome from '@/components/jobSeekerHome';
import EmployerHome from '@/components/EmployerHome';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  userName: string;
  exp: number;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function Index() {
  const [user, setUser] = useState<JwtPayload | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      return;
    }

    setUser(decoded);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {!user && <JobSeekerHome />}
          {user?.role === 'JOB_SEEKER' && <JobSeekerHome />}
          {user?.role === 'EMPLOYER' && <EmployerHome />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
