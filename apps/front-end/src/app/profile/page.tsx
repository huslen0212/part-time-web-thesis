'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Rating } from '@mui/material';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Calendar,
  MapPin,
  SlidersHorizontal,
  Mail,
  Phone,
  User,
  Pencil,
  Clock,
  Hourglass,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Venus,
  Home,
  Cake,
  Star,
  Briefcase,
} from 'lucide-react';
import ApprovedJobsCalendar from '@/components/ApprovedJobsCalendar';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type Gender = 'MALE' | 'FEMALE';

const genderLabel: Record<Gender, string> = {
  MALE: 'Эрэгтэй',
  FEMALE: 'Эмэгтэй',
};

type Profile = {
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  address?: string | null;
};

type MyRequest = {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCEL';
  createdAt: string;
  job: {
    jobId: number;
    title: string;
    location: string;
    description?: string | null;
    category: { categoryId: number; name: string };
    startTime: string;
    endTime: string;
  };
};

type UserRating = {
  average: number | null;
  count: number;
};

// Үнэлгээний дэлгэрэнгүй мэдээлэл
type RatingDetail = {
  score: number;
  comment: string | null;
  createdAt: string;
  job?: { title?: string | null } | null;
  fromUser?: {
    employer?: { employerName?: string | null } | null;
    jobSeeker?: { userName?: string | null } | null;
  };
};

type ApprovedFilter = 'all' | 'upcoming' | 'past';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Хүлээгдэж буй',
    icon: <Hourglass size={13} />,
    header: 'bg-amber-50 border-amber-200 text-amber-700',
    count: 'bg-amber-100 text-amber-700',
    card: 'border-zinc-200 hover:border-amber-300',
  },
  APPROVED: {
    label: 'Зөвшөөрсөн',
    icon: <CheckCircle2 size={13} />,
    header: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    count: 'bg-emerald-100 text-emerald-700',
    card: 'border-emerald-200 hover:border-emerald-400',
  },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formattedDate} ${formattedTime}`;
}

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={cn(
            s <= score
              ? 'text-amber-400 fill-amber-400'
              : 'text-zinc-200 fill-zinc-200',
          )}
        />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [editProfile, setEditProfile] = useState<Profile>({});
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedFilter, setApprovedFilter] = useState<ApprovedFilter>('all');
  const [otherFilter, setOtherFilter] = useState<'REJECTED' | 'CANCEL'>(
    'REJECTED',
  );
  const [showOther, setShowOther] = useState(false);
  const [userRating, setUserRating] = useState<UserRating>({
    average: null,
    count: 0,
  });

  // Үнэлгээний dialog state
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean;
    ratings: RatingDetail[];
    loading: boolean;
  }>({ open: false, ratings: [], loading: false });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/profile`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/requests/me`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/ratings/me`, { headers }).then((r) => r.json()),
    ])
      .then(([profileData, requestData, ratingData]) => {
        setProfile(profileData);
        setEditProfile({
          email: profileData.email || '',
          userName: profileData.userName || '',
          phoneNumber: profileData.phoneNumber || '',
          birthDate: profileData.birthDate
            ? new Date(profileData.birthDate).toISOString().split('T')[0]
            : '',
          gender: profileData.gender || '',
          address: profileData.address || '',
        });
        setRequests(requestData);
        setUserRating(ratingData);
      })
      .catch(() => toast.error('Мэдээлэл ачаалж чадсангүй'))
      .finally(() => setLoading(false));
  }, []);

  // Бүх үнэлгээг татах
  const openRatingDialog = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRatingDialog({ open: true, ratings: [], loading: true });

    try {
      const res = await fetch(`${API_URL}/ratings/me/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRatingDialog({
        open: true,
        ratings: Array.isArray(data) ? data : (data.ratings ?? []),
        loading: false,
      });
    } catch {
      toast.error('Үнэлгээ ачаалж чадсангүй');
      setRatingDialog((p) => ({ ...p, loading: false }));
    }
  };

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editProfile),
    });
    if (res.ok) {
      setProfile(editProfile);
      toast.success('Амжилттай хадгалагдлаа');
    } else {
      toast.error('Хадгалах үед алдаа гарлаа');
    }
  };

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const pending = requests.filter((r) => r.status === 'PENDING');
  const approved = requests.filter((r) => r.status === 'APPROVED');
  const rejected = requests.filter((r) => r.status === 'REJECTED');
  const cancelled = requests.filter((r) => r.status === 'CANCEL');
  const otherAll = [...rejected, ...cancelled];
  const filteredOther = otherAll.filter((r) => r.status === otherFilter);

  const filteredApproved = approved.filter((r) => {
    if (approvedFilter === 'upcoming')
      return new Date(r.job.startTime) >= startOfToday;
    if (approvedFilter === 'past')
      return new Date(r.job.startTime) < startOfToday;
    return true;
  });

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* ── Left: Profile ── */}
          <div className="flex flex-col gap-4">
            <Card className="shadow-none rounded-2xl border-zinc-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Avatar */}
                <div className="flex flex-col items-center py-8 px-6">
                  <p className="font-bold text-zinc-900">
                    {profile.userName || '—'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-full">
                    {profile.email || '—'}
                  </p>
                </div>

                {/* ── Rating хэсэг ── */}
                <div className="flex flex-col items-center gap-1 pb-4">
                  <Rating
                    value={userRating.average ?? 0}
                    precision={0.1}
                    readOnly
                    size="small"
                  />
                  <p className="text-xs text-zinc-400">
                    {userRating.average !== null
                      ? `${userRating.average.toFixed(1)} (${userRating.count} үнэлгээ)`
                      : 'Үнэлгээ байхгүй'}
                  </p>

                  {/* ── Бүх үнэлгээг харах товч ── */}
                  {userRating.count > 0 && (
                    <button
                      onClick={openRatingDialog}
                      className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                    >
                      <Star
                        size={11}
                        className="text-amber-400 fill-amber-400"
                      />
                      Бүх үнэлгээг харах
                    </button>
                  )}
                </div>

                <Separator />

                {/* Info */}
                <div className="px-5 py-4 space-y-3">
                  <ProfileRow
                    icon={<Mail size={13} />}
                    label="Имэйл"
                    value={profile.email}
                  />
                  <ProfileRow
                    icon={<User size={13} />}
                    label="Нэр"
                    value={profile.userName}
                  />
                  <ProfileRow
                    icon={<Phone size={13} />}
                    label="Утас"
                    value={profile.phoneNumber}
                  />
                  <ProfileRow
                    icon={<Cake size={13} />}
                    label="Төрсөн огноо"
                    value={
                      profile.birthDate
                        ? new Date(profile.birthDate).toLocaleDateString(
                            'mn-MN',
                          )
                        : null
                    }
                  />
                  <ProfileRow
                    icon={<Venus size={13} />}
                    label="Хүйс"
                    value={profile.gender ? genderLabel[profile.gender] : null}
                  />
                  <ProfileRow
                    icon={<Home size={13} />}
                    label="Хаяг"
                    value={profile.address}
                  />
                </div>

                {/* Edit */}
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
                      className="w-76 rounded-2xl p-5 shadow-xl border-zinc-200"
                      align="start"
                    >
                      <p className="text-sm font-semibold text-zinc-800 mb-4">
                        Профайл засах
                      </p>
                      <div className="space-y-3">
                        {[
                          { label: 'Имэйл', key: 'email' },
                          { label: 'Нэр', key: 'userName' },
                          { label: 'Утас', key: 'phoneNumber' },
                          { label: 'Хаяг', key: 'address' },
                        ].map(({ label, key }) => (
                          <div key={key} className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500">
                              {label}
                            </Label>
                            <Input
                              value={(editProfile as Record<string, string | null | undefined>)[key] || ''}
                              onChange={(e) =>
                                setEditProfile({
                                  ...editProfile,
                                  [key]: e.target.value,
                                })
                              }
                              className="rounded-xl border-zinc-200 focus-visible:ring-[#2872A1]"
                            />
                          </div>
                        ))}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-500">
                            Төрсөн огноо
                          </Label>
                          <Input
                            type="date"
                            value={editProfile.birthDate || ''}
                            onChange={(e) =>
                              setEditProfile({
                                ...editProfile,
                                birthDate: e.target.value,
                              })
                            }
                            className="rounded-xl border-zinc-200 focus-visible:ring-[#2872A1]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-500">
                            Хүйс
                          </Label>
                          <Select
                            value={editProfile.gender || ''}
                            onValueChange={(v) =>
                              setEditProfile({
                                ...editProfile,
                                gender: v as Gender,
                              })
                            }
                          >
                            <SelectTrigger className="rounded-xl border-zinc-200 focus-visible:ring-[#2872A1] h-10 text-sm">
                              <SelectValue placeholder="Сонгох" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Эрэгтэй</SelectItem>
                              <SelectItem value="FEMALE">Эмэгтэй</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="w-full rounded-xl bg-[#2872A1] hover:bg-[#2872A1]/80 mt-1"
                          onClick={saveProfile}
                        >
                          Хадгалах
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Calendar + Requests ── */}
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                Ажлын хуваарь
              </h2>
              <Card className="shadow-none rounded-2xl border-zinc-200">
                <CardContent className="p-6">
                  <ApprovedJobsCalendar items={approved} />
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold text-zinc-900 mb-5">
                Миний илгээсэн хүсэлтүүд
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* ── PENDING ── */}
                <div className="flex flex-col gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl border',
                      STATUS_CONFIG.PENDING.header,
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {STATUS_CONFIG.PENDING.icon}
                      {STATUS_CONFIG.PENDING.label}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        STATUS_CONFIG.PENDING.count,
                      )}
                    >
                      {pending.length}
                    </span>
                  </div>
                  {pending.length === 0 && <EmptyColumn />}
                  {pending.map((r) => (
                    <RequestCard
                      key={r.requestId}
                      r={r}
                      cardClass={STATUS_CONFIG.PENDING.card}
                    />
                  ))}
                </div>

                {/* ── APPROVED ── */}
                <div className="flex flex-col gap-3">
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl border',
                      STATUS_CONFIG.APPROVED.header,
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {STATUS_CONFIG.APPROVED.icon}
                      {STATUS_CONFIG.APPROVED.label}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        STATUS_CONFIG.APPROVED.count,
                      )}
                    >
                      {filteredApproved.length}
                    </span>
                  </div>

                  <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-xl">
                    {(
                      [
                        { key: 'all', label: 'Бүгд' },
                        { key: 'upcoming', label: 'Өнөөдрөөс хойш' },
                        { key: 'past', label: 'Өнөөдрөөс өмнө' },
                      ] as { key: ApprovedFilter; label: string }[]
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setApprovedFilter(key)}
                        className={cn(
                          'flex-1 text-xs font-medium py-1.5 rounded-lg transition-all',
                          approvedFilter === key
                            ? 'bg-white text-[#0D3B66] shadow-sm'
                            : 'text-zinc-400 hover:text-[#7F9DB1]',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {filteredApproved.length === 0 && <EmptyColumn />}
                  {filteredApproved.map((r) => (
                    <RequestCard
                      key={r.requestId}
                      r={r}
                      cardClass={STATUS_CONFIG.APPROVED.card}
                    />
                  ))}
                </div>

                {/* ── REJECTED / CANCEL ── */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowOther((v) => !v)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
                  >
                    <span className="flex items-center gap-2">
                      {showOther ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      Татгалзсан / Цуцлагдсан
                    </span>
                    <span className="text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                      {otherAll.length}
                    </span>
                  </button>

                  {showOther && (
                    <>
                      <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-xl">
                        {[
                          { key: 'REJECTED', label: 'Татгалзсан' },
                          { key: 'CANCEL', label: 'Цуцлагдсан' },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() =>
                              setOtherFilter(key as 'REJECTED' | 'CANCEL')
                            }
                            className={cn(
                              'flex-1 text-xs font-medium py-1.5 rounded-lg transition-all',
                              otherFilter === key
                                ? 'bg-white text-[#0D3B66] shadow-sm'
                                : 'text-zinc-400 hover:text-[#7F9DB1]',
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {filteredOther.length === 0 && <EmptyColumn />}
                      {filteredOther.map((r) => (
                        <RequestCard
                          key={r.requestId}
                          r={r}
                          cardClass={
                            r.status === 'REJECTED'
                              ? 'border-red-100 hover:border-red-200 opacity-70'
                              : 'border-zinc-200 hover:border-zinc-300 opacity-70'
                          }
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Үнэлгээний Dialog ── */}
      <Dialog
        open={ratingDialog.open}
        onOpenChange={(o) => setRatingDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100">
            <DialogTitle className="text-base font-semibold text-zinc-900">
              Миний үнэлгээнүүд
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    className={cn(
                      userRating.average && s <= Math.round(userRating.average)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-zinc-200 fill-zinc-200',
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-zinc-800">
                {userRating.average?.toFixed(1) ?? '—'}
              </span>
              <span className="text-xs text-zinc-400">
                ({userRating.count} үнэлгээ)
              </span>
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-zinc-100">
            {ratingDialog.loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
              </div>
            ) : ratingDialog.ratings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2">
                <Star size={24} />
                <p className="text-xs">Үнэлгээ байхгүй</p>
              </div>
            ) : (
              ratingDialog.ratings.map((r, i) => {
                const from =
                  r.fromUser?.employer?.employerName ||
                  r.fromUser?.jobSeeker?.userName ||
                  'Хэрэглэгч';
                return (
                  <div key={i} className="px-6 py-4 flex flex-col gap-2">
                    {/* Хэн үнэлсэн + одод */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-700">
                        {from}
                      </span>
                      <StarRow score={r.score} />
                    </div>

                    {/* Ямар ажил дээр үнэлгээ авсан */}
                    {r.job?.title && (
                      <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 rounded-lg px-2.5 py-1.5">
                        <Briefcase
                          size={11}
                          className="text-zinc-400 shrink-0"
                        />
                        <span className="text-[11px] text-zinc-500 truncate">
                          {r.job.title}
                        </span>
                      </div>
                    )}

                    {/* Comment */}
                    {r.comment && (
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {r.comment}
                      </p>
                    )}

                    {/* Огноо */}
                    <p className="text-[10px] text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-zinc-300 gap-1.5 border-2 border-dashed border-zinc-200 rounded-xl">
      <Users size={18} />
      <p className="text-xs">Хоосон</p>
    </div>
  );
}

function RequestCard({ r, cardClass }: { r: MyRequest; cardClass: string }) {
  return (
    <Link href={`/jobs/${r.job.jobId}`} className="block">
      <Card
        className={cn(
          'shadow-none rounded-2xl border transition-all bg-white hover:shadow-sm',
          cardClass,
        )}
      >
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-1">
            {r.job.title}
          </p>
          {r.job.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {r.job.description}
            </p>
          )}
          <Separator />
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <MapPin size={11} className="text-zinc-400 shrink-0" />
              <span className="truncate">{r.job.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <SlidersHorizontal size={11} className="text-zinc-400 shrink-0" />
              {r.job.category.name}
            </div>
            <div className="flex items-start gap-1.5 text-xs text-zinc-500">
              <Clock size={11} className="text-zinc-400 mt-0.5 shrink-0" />
              <div>
                <div>
                  {formatDate(r.job.startTime)} → {formatDate(r.job.endTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <Calendar size={10} className="shrink-0" />
              Илгээсэн: {formatDate(r.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
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
