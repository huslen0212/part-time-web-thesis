'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Bell,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  CircleUser,
  LogOut,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

function formatNotifDate(dateString: string) {
  const date = new Date(dateString);

  const formattedDate = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
  });

  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${formattedDate} ${formattedTime}`;
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
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem('token');
      setUser(null);
      return;
    }
    setUser(decoded);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3001/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Notification[]) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      })
      .catch(console.error);
  }, [user]);

  const markAsRead = async (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(
        `http://localhost:3001/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
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

  const markAllRead = async () => {
    notifications
      .filter((n) => !n.isRead)
      .forEach((n) => markAsRead(n.notificationId));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const activeRole = overrideRole ?? user?.role;

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#2872a1] flex items-center justify-center">
            <BriefcaseBusiness size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-900 tracking-tight hidden sm:block">
            Part-Time Jobs
          </span>
        </Link>

        <nav className="flex items-center gap-2 ml-auto">
          {/* JOB SEEKER */}
          {activeRole === 'JOB_SEEKER' && (
            <Link href="/calendar">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-zinc-600 hover:text-[#2872A1]/80 rounded-lg"
              >
                <Calendar size={14} />
                Календар үүсгэх
              </Button>
            </Link>
          )}

          {/* EMPLOYER */}
          {activeRole === 'EMPLOYER' && (
            <Link href="/createJob">
              <Button
                size="sm"
                className="gap-1.5 bg-[#2872a1] hover:bg-[#2872a1]/80 text-white rounded-lg h-8 px-3 text-xs font-semibold"
              >
                <Plus size={14} />
                Ажил нэмэх
              </Button>
            </Link>
          )}

          {/* Notifications */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-8 h-8 rounded-lg"
                >
                  <Bell size={16} className="text-zinc-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#2872a1] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-80 p-0 rounded-2xl overflow-hidden shadow-lg border-zinc-200"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                  <span className="text-sm font-semibold text-zinc-800">
                    Мэдэгдэл
                  </span>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#2872a1] font-medium hover:text-[#2872A1]/80"
                    >
                      Бүгдийг уншсан
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-zinc-300 gap-2">
                      <Bell size={24} />
                      <p className="text-xs">Мэдэгдэл байхгүй</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={n.notificationId}>
                        <button
                          onClick={() => markAsRead(n.notificationId)}
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors',
                            !n.isRead && 'bg-[#B4D6E3]/40',
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                                n.isRead ? 'bg-zinc-200' : 'bg-[#2872a1]',
                              )}
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-800 leading-tight">
                                {n.title}
                              </p>

                              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>

                              <p className="text-[10px] text-zinc-400 mt-1">
                                {formatNotifDate(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>

                        {i < notifications.length - 1 && (
                          <div className="h-px bg-zinc-100 mx-4" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* USER MENU */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg h-8 px-3 border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
                >
                  <span className="max-w-[120px] truncate hidden sm:block">
                    {user.userName}
                  </span>
                  <ChevronDown size={12} className="text-zinc-400 shrink-0" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border-zinc-200 shadow-lg p-1"
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-xs font-semibold text-zinc-800 truncate">
                    {user.userName}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {user.role === 'EMPLOYER' ? 'Ажил олгогч' : 'Ажил хайгч'}
                  </p>
                </div>

                <DropdownMenuSeparator className="bg-zinc-100" />

                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      user?.role === 'EMPLOYER'
                        ? '/employerProfile'
                        : '/profile',
                    )
                  }
                  className="rounded-lg text-sm gap-2 cursor-pointer"
                >
                  <CircleUser size={14} className="text-zinc-500" />
                  Профайл
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={logout}
                  className="rounded-lg text-sm gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut size={14} />
                  Гарах
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-8 px-4 text-xs font-semibold border-zinc-300 hover:bg-zinc-50"
              >
                Нэвтрэх
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
