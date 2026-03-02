'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Bell } from 'lucide-react';

type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  userName: string;
  exp: number;
};

type Notification = {
  notificationId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function Header() {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pathname = usePathname() || '/';
  const router = useRouter();

  const overrideRole = pathname.startsWith('/createJob')
    ? ('EMPLOYER' as const)
    : pathname.startsWith('/calendar') || pathname.startsWith('/jobs')
      ? ('JOB_SEEKER' as const)
      : undefined;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (!decoded) return;

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      setUser(null);
      return;
    }

    setUser(decoded);
  }, [pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:3001/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      } catch (error) {
        console.error(error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(
        `http://localhost:3001/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updated = notifications.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n,
      );

      setNotifications(updated);
      setUnreadCount(updated.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const activeRole = overrideRole ?? user?.role;

  return (
    <header className="border-b border-black/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          Part-Time Job System
        </Link>

        <nav className="flex items-center gap-6">
          {activeRole === 'JOB_SEEKER' && (
            <Link href="/calendar" className="text-sm hover:underline">
              Ажил хайх
            </Link>
          )}

          {activeRole === 'EMPLOYER' && (
            <Link href="/createJob" className="text-sm hover:underline">
              Ажил нэмэх
            </Link>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-80 max-h-96 overflow-y-auto"
              >
                {notifications.length === 0 && (
                  <DropdownMenuItem disabled>
                    Notification байхгүй
                  </DropdownMenuItem>
                )}

                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.notificationId}
                    onClick={() => markAsRead(n.notificationId)}
                    className={`flex flex-col items-start cursor-pointer ${
                      !n.isRead ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span className="font-medium text-sm">{n.title}</span>
                    <span className="text-xs text-black/60">{n.message}</span>
                    <span className="text-[10px] text-black/40 mt-1">
                      {new Date(n.createdAt).toLocaleString('mn-MN')}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {user.userName}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Профайл
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Гарах</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg border border-black text-sm hover:bg-black hover:text-white transition"
            >
              Нэвтрэх
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
