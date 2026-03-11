'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Building2,
  Pencil,
  MapPin,
  Tag,
  Clock,
  Users,
  Banknote,
  CalendarDays,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type TimeFilter = 'all' | 'upcoming' | 'past';

type Job = {
  jobId: number;
  title: string;
  location: string;
  category: string;
  salary: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  _count: { requests: number };
};

type EmployerProfile = {
  employerName: string | null;
  phoneNumber: string | null;
  email: string;
  createdAt: string;
  userCreatedAt: string;
  jobs: Job[];
};

type EditForm = {
  employerName: string;
  phoneNumber: string;
  email: string;
};

type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  userName: string;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  );
}

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [role, setRole] = useState<'EMPLOYER' | 'JOB_SEEKER' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    employerName: '',
    phoneNumber: '',
    email: '',
  });

  // Filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const decoded = decodeToken(token);
    if (decoded) setRole(decoded.role);

    fetch(`${API_URL}/employer`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: EmployerProfile) => {
        setProfile(data);
        setEditForm({
          employerName: data.employerName || '',
          phoneNumber: data.phoneNumber || '',
          email: data.email || '',
        });
      })
      .catch(() => toast.error('Мэдээлэл ачаалж чадсангүй'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/employer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                employerName: editForm.employerName,
                phoneNumber: editForm.phoneNumber,
                email: editForm.email,
              }
            : prev,
        );
        toast.success('Амжилттай хадгалагдлаа');
      } else {
        toast.error('Хадгалах үед алдаа гарлаа');
      }
    } catch {
      toast.error('Сервертэй холбогдож чадсангүй');
    } finally {
      setSaving(false);
    }
  };

  const isEmployer = role === 'EMPLOYER';
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (!profile) return [];
    return profile.jobs.filter((job) => {
      if (timeFilter === 'upcoming' && new Date(job.startTime) < startOfToday)
        return false;
      if (timeFilter === 'past' && new Date(job.startTime) >= startOfToday)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          job.title.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [profile, timeFilter, searchQuery]);

  // Category chips
  const categories = useMemo(() => {
    if (!profile) return [];
    const map: Record<string, number> = {};
    profile.jobs.forEach((j) => {
      map[j.category] = (map[j.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
            <p className="text-sm">Ачаалж байна...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          {/* ── Left: Profile card ── */}
          <div className="flex flex-col gap-4">
            <Card className="shadow-none rounded-2xl border-zinc-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Banner */}
                <div className="h-16" />

                {/* Employer name */}
                <div className="flex flex-col items-center -mt-6 pb-6 px-6">
                  <p className="font-bold text-zinc-900 mt-3 text-center">
                    {profile.employerName || '—'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-full text-center">
                    {profile.email}
                  </p>
                </div>

                <Separator />

                {/* Info rows */}
                <div className="px-5 py-4 space-y-3">
                  <ProfileRow
                    icon={<Mail size={13} />}
                    label="Имэйл"
                    value={profile.email}
                  />
                  <ProfileRow
                    icon={<Building2 size={13} />}
                    label="Байгууллагын нэр"
                    value={profile.employerName}
                  />
                  <ProfileRow
                    icon={<Phone size={13} />}
                    label="Утас"
                    value={profile.phoneNumber}
                  />
                  <ProfileRow
                    icon={<CalendarDays size={13} />}
                    label="Бүртгүүлсэн"
                    value={formatDate(profile.userCreatedAt)}
                  />
                  <ProfileRow
                    icon={<Briefcase size={13} />}
                    label="Нийт зар"
                    value={`${profile.jobs.length} зар`}
                  />
                </div>

                {/* Category chips */}
                {categories.length > 0 && (
                  <>
                    <Separator />
                    <div className="px-5 py-4">
                      <p className="text-[10px] text-zinc-400 font-medium mb-2">
                        Категориор шүүх
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map(([cat, count]) => (
                          <button
                            key={cat}
                            onClick={() =>
                              setSearchQuery((prev) =>
                                prev === cat ? '' : cat,
                              )
                            }
                            className={cn(
                              'text-[10px] px-2 py-1 rounded-lg font-medium transition-colors',
                              searchQuery === cat
                                ? 'bg-[#2872A1] text-white'
                                : 'bg-zinc-100 text-zinc-500 hover:bg-[#e8f3fb] hover:text-[#2872A1]',
                            )}
                          >
                            {cat} · {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Edit — зөвхөн EMPLOYER */}
                {isEmployer && (
                  <div className="px-5 pb-5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full rounded-xl gap-2 border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50"
                        >
                          <Pencil size={13} /> Засах
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 rounded-2xl p-5 shadow-xl border-zinc-200"
                        align="start"
                      >
                        <p className="text-sm font-semibold text-zinc-800 mb-4">
                          Профайл засах
                        </p>
                        <div className="space-y-3">
                          {[
                            { label: 'Имэйл', key: 'email' },
                            { label: 'Байгууллагын нэр', key: 'employerName' },
                            { label: 'Утас', key: 'phoneNumber' },
                          ].map(({ label, key }) => (
                            <div key={key} className="space-y-1.5">
                              <Label className="text-xs font-medium text-zinc-500">
                                {label}
                              </Label>
                              <Input
                                value={(editForm as any)[key] || ''}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    [key]: e.target.value,
                                  })
                                }
                                className="rounded-xl border-zinc-200 focus-visible:ring-[#2872A1] h-10 text-sm"
                              />
                            </div>
                          ))}
                          <Button
                            className="w-full rounded-xl bg-[#2872A1] hover:bg-[#1f5c82] mt-1"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Jobs ── */}
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Ажлын зарууд</h2>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Time tabs */}
              <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl shrink-0">
                {(
                  [
                    { key: 'all', label: 'Бүгд', count: profile.jobs.length },
                    { key: 'upcoming', label: 'Өнөөдрөөс хойш', count: null },
                    { key: 'past', label: 'Өнөөдрөөс өмнө', count: null },
                  ] as {
                    key: TimeFilter;
                    label: string;
                    count: number | null;
                  }[]
                ).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setTimeFilter(key)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap',
                      timeFilter === key
                        ? 'bg-white text-[#2872A1] shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-600',
                    )}
                  >
                    {label}
                    {count !== null && (
                      <span className="ml-1.5 text-[10px] bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            {(timeFilter !== 'all' || searchQuery) && (
              <p className="text-xs text-zinc-400 -mt-1">
                {filteredJobs.length} зар олдлоо
              </p>
            )}

            {/* Job grid */}
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-300 gap-2 border-2 border-dashed border-zinc-200 rounded-2xl">
                <Briefcase size={28} />
                <p className="text-sm">Зар олдсонгүй</p>
                {(timeFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setTimeFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-[#2872A1] hover:underline mt-1"
                  >
                    Filter арилгах
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => (
                  <Link
                    key={job.jobId}
                    href={`/jobs/${job.jobId}`}
                    className="block"
                  >
                    <Card className="shadow-none rounded-2xl border-zinc-200 hover:border-[#2872A1] hover:shadow-sm transition-all bg-white cursor-pointer">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-2 flex-1">
                            {job.title}
                          </p>
                          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-1 rounded-lg shrink-0 font-medium">
                            {job.category}
                          </span>
                        </div>

                        <Separator />

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <MapPin
                              size={11}
                              className="text-zinc-400 shrink-0"
                            />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Banknote
                              size={11}
                              className="text-zinc-400 shrink-0"
                            />
                            {job.salary.toLocaleString()}₮
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-zinc-500">
                            <Clock
                              size={11}
                              className="text-zinc-400 mt-0.5 shrink-0"
                            />
                            <span>
                              {formatDateTime(job.startTime)} →{' '}
                              {formatDateTime(job.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Users
                              size={11}
                              className="text-zinc-400 shrink-0"
                            />
                            {job._count.requests} хүсэлт
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <Tag size={10} className="shrink-0" />
                            Нийтлэгдсэн: {formatDate(job.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-zinc-400 font-medium">{label}</p>
        <p className="text-sm font-medium text-zinc-800 truncate">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}
