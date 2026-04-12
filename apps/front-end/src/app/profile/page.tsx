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
import { TimePicker } from '@mantine/dates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Banknote,
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
  Tag,
  Plus,
  Trash2,
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
  skills?: string | null;
  interestedCategory?: { categoryId: number; name: string } | null;
  availabilities?: Availability[];
};

type Availability = {
  id: number;
  day: number;
  startTime: string;
  endTime: string;
};

type CategoryOption = { value: string; label: string };

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

type InviteItem = {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCEL';
  createdAt: string;
  job: {
    jobId: number;
    title: string;
    location: string;
    salary: number;
    startTime: string;
    endTime: string;
    category: { name: string };
    employer: { employerName: string | null };
  };
};

type UserRating = {
  average: number | null;
  count: number;
};

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
  const [requestTab, setRequestTab] = useState<'sent' | 'received'>('sent');
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActingId, setInviteActingId] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<UserRating>({
    average: null,
    count: 0,
  });

  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean;
    ratings: RatingDetail[];
    loading: boolean;
  }>({ open: false, ratings: [], loading: false });

  const [skillsDialog, setSkillsDialog] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [editCategory, setEditCategory] = useState<CategoryOption | null>(null);

  const [newAvail, setNewAvail] = useState({
    day: 1,
    startTime: '09:00',
    endTime: '17:00',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    setInvitesLoading(true);

    Promise.all([
      fetch(`${API_URL}/profile`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/requests/me`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/ratings/me`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/requests/me/invites`, { headers }).then((r) =>
        r.json(),
      ),
    ])
      .then(([profileData, requestData, ratingData, inviteData]) => {
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
          skills: profileData.skills || '',
        });
        if (profileData.interestedCategory) {
          setEditCategory({
            value: profileData.interestedCategory.name,
            label: profileData.interestedCategory.name,
          });
        }
        setRequests(requestData);
        setUserRating(ratingData);
        setInvites(Array.isArray(inviteData) ? inviteData : []);
      })
      .catch(() => toast.error('Мэдээлэл ачаалж чадсангүй'))
      .finally(() => {
        setLoading(false);
        setInvitesLoading(false);
      });

    fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((data) =>
        setCategoryOptions(
          data.map((c: { name: string }) => ({ value: c.name, label: c.name })),
        ),
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (requestTab !== 'received') return;
    setInvitesLoading(false);
  }, [requestTab]);

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

  const openSkillsDialog = () => setSkillsDialog(true);

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...editProfile,
        interestedCategoryName: editCategory?.value ?? null,
      }),
    });
    if (res.ok) {
      setProfile({
        ...editProfile,
        interestedCategory: editCategory
          ? { categoryId: 0, name: editCategory.value }
          : null,
        availabilities: profile.availabilities,
      });
      toast.success('Амжилттай хадгалагдлаа');
    } else {
      toast.error('Хадгалах үед алдаа гарлаа');
    }
  };

  const saveSkillsDialog = async () => {
    await saveProfile();
    setSkillsDialog(false);
  };

  const addAvailability = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const startDate = new Date(`1970-01-01T${newAvail.startTime}:00`);
    const endDate = new Date(`1970-01-01T${newAvail.endTime}:00`);
    if (endDate <= startDate) {
      toast.warning('Дуусах цаг эхлэх цагаас хойш байх ёстой');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/profile/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day: newAvail.day,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setProfile((p) => ({
        ...p,
        availabilities: [...(p.availabilities ?? []), created],
      }));
      toast.success('Нэмэгдлээ');
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  const deleteAvailability = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/profile/availability/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setProfile((p) => ({
        ...p,
        availabilities: (p.availabilities ?? []).filter((a) => a.id !== id),
      }));
      toast.success('Устгагдлаа');
    } catch {
      toast.error('Алдаа гарлаа');
    }
  };

  const handleInviteAction = async (
    requestId: number,
    action: 'accept' | 'reject',
  ) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setInviteActingId(requestId);
    try {
      const res = await fetch(
        `${API_URL}/requests/${requestId}/invite-response`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Алдаа гарлаа');
        return;
      }
      setInvites((prev) =>
        prev.map((inv) =>
          inv.requestId === requestId
            ? { ...inv, status: action === 'accept' ? 'APPROVED' : 'REJECTED' }
            : inv,
        ),
      );
      if (action === 'accept') {
        toast.success('Зөвшөөрлөө — ажлын хуваарьт нэмэгдлээ');
        fetch(`${API_URL}/requests/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then(setRequests)
          .catch(console.error);
      } else {
        toast.success('Татгалзлаа');
      }
    } catch {
      toast.error('Алдаа гарлаа');
    } finally {
      setInviteActingId(null);
    }
  };

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  // invite-аар ирсэн jobId-уудыг sent tab-аас хасна
  const inviteJobIds = new Set(invites.map((i) => i.job.jobId));
  const sentRequests = requests.filter((r) => !inviteJobIds.has(r.job.jobId));

  const pending = sentRequests.filter((r) => r.status === 'PENDING');
  const approved = sentRequests.filter((r) => r.status === 'APPROVED');
  const rejected = sentRequests.filter((r) => r.status === 'REJECTED');
  const cancelled = sentRequests.filter((r) => r.status === 'CANCEL');
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
                <div className="flex flex-col items-center py-8 px-6">
                  <p className="font-bold text-zinc-900">
                    {profile.userName || '—'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-full">
                    {profile.email || '—'}
                  </p>
                </div>

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
                              value={
                                (
                                  editProfile as Record<
                                    string,
                                    string | null | undefined
                                  >
                                )[key] || ''
                              }
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

            {/* Skills + Category + Availability */}
            <Card className="shadow-none rounded-2xl border-zinc-200">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Tag size={14} className="text-[#2872a1]" /> Сонирхож буй
                  ажлын төрөл
                </div>
                {profile.interestedCategory ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#2872a1] bg-[#2872a1]/10 px-2.5 py-1 rounded-full">
                      {profile.interestedCategory.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">Чиглэл оруулаагүй</p>
                )}

                <Separator />

                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Star size={14} className="text-[#2872a1]" /> Миний чадвар
                </div>
                {profile.skills ? (
                  <p className="text-xs text-zinc-600">{profile.skills}</p>
                ) : (
                  <p className="text-xs text-zinc-400">Чадвар оруулаагүй</p>
                )}

                <Separator />

                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <Clock size={14} className="text-[#2872a1]" /> Боломжит цаг
                </div>
                {(profile.availabilities ?? []).length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    Цагийн хуваарь оруулаагүй
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(profile.availabilities ?? []).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-100 bg-zinc-50"
                      >
                        <span className="text-xs font-semibold text-zinc-700 w-16">
                          {
                            [
                              'Даваа',
                              'Мягмар',
                              'Лхагва',
                              'Пүрэв',
                              'Баасан',
                              'Бямба',
                              'Ням',
                            ][a.day - 1]
                          }
                        </span>
                        <span className="text-xs text-zinc-400">
                          {new Date(a.startTime).toLocaleTimeString('mn-MN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                          {' – '}
                          {new Date(a.endTime).toLocaleTimeString('mn-MN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50"
                  onClick={openSkillsDialog}
                >
                  <Pencil size={13} /> Засах
                </Button>
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
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => setRequestTab('sent')}
                  className={cn(
                    'px-5 py-2 rounded-xl text-sm font-semibold border transition-all',
                    requestTab === 'sent'
                      ? 'bg-[#2872a1] text-white border-[#2872a1]'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400',
                  )}
                >
                  Миний илгээсэн хүсэлтүүд
                </button>
                <button
                  onClick={() => setRequestTab('received')}
                  className={cn(
                    'px-5 py-2 rounded-xl text-sm font-semibold border transition-all',
                    requestTab === 'received'
                      ? 'bg-[#2872a1] text-white border-[#2872a1]'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400',
                  )}
                >
                  Надад ирсэн хүсэлтүүд
                </button>
              </div>

              {/* ── Sent requests ── */}
              {requestTab === 'sent' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* PENDING */}
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

                  {/* APPROVED */}
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

                  {/* REJECTED / CANCEL */}
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
              )}

              {/* ── Received invites ── */}
              {requestTab === 'received' && (
                <div className="flex flex-col gap-3">
                  {invitesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
                    </div>
                  ) : invites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2">
                      <Users size={30} />
                      <p className="text-sm">Ирсэн ажлын санал байхгүй</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {invites.map((inv) => {
                        const isActing = inviteActingId === inv.requestId;
                        const isPending = inv.status === 'PENDING';
                        return (
                          <Link
                            key={inv.requestId}
                            href={`/jobs/${inv.job.jobId}`}
                            className="block"
                          >
                            <Card
                              className={cn(
                                'shadow-none rounded-2xl border transition-all bg-white hover:shadow-sm cursor-pointer',
                                inv.status === 'APPROVED'
                                  ? 'border-emerald-200 bg-emerald-50/40'
                                  : inv.status === 'REJECTED'
                                    ? 'border-zinc-200 opacity-60'
                                    : 'border-[#CBDDE9] hover:border-[#2872a1]/40',
                              )}
                            >
                              <CardContent className="p-4 space-y-3">
                                <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-1">
                                  {inv.job.title}
                                </p>
                                <Separator />
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <MapPin
                                      size={11}
                                      className="text-zinc-400 shrink-0"
                                    />
                                    <span className="truncate">
                                      {inv.job.location}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <SlidersHorizontal
                                      size={11}
                                      className="text-zinc-400 shrink-0"
                                    />
                                    {inv.job.category.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <Banknote
                                      size={11}
                                      className="text-zinc-400 shrink-0"
                                    />
                                    {inv.job.salary.toLocaleString()} ₮
                                  </div>
                                  <div className="flex items-start gap-1.5 text-xs text-zinc-500">
                                    <Clock
                                      size={11}
                                      className="text-zinc-400 mt-0.5 shrink-0"
                                    />
                                    <div>
                                      {formatDate(inv.job.startTime)} →{' '}
                                      {formatDate(inv.job.endTime)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                    <Calendar size={10} className="shrink-0" />
                                    Ирсэн: {formatDate(inv.createdAt)}
                                  </div>
                                </div>
                                <Separator />
                                {isPending ? (
                                  <div
                                    className="flex gap-2"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <Button
                                      size="sm"
                                      disabled={isActing}
                                      className="flex-1 h-8 text-xs rounded-xl bg-[#2872a1] hover:bg-[#1f5c82] text-white"
                                      onClick={() =>
                                        handleInviteAction(
                                          inv.requestId,
                                          'accept',
                                        )
                                      }
                                    >
                                      {isActing ? (
                                        <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        'Зөвшөөрөх'
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isActing}
                                      className="flex-1 h-8 text-xs rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                      onClick={() =>
                                        handleInviteAction(
                                          inv.requestId,
                                          'reject',
                                        )
                                      }
                                    >
                                      Татгалзах
                                    </Button>
                                  </div>
                                ) : (
                                  <p
                                    className={cn(
                                      'text-xs font-medium text-center py-1',
                                      inv.status === 'APPROVED'
                                        ? 'text-emerald-600'
                                        : 'text-zinc-400',
                                    )}
                                  >
                                    {inv.status === 'APPROVED'
                                      ? '✓ Зөвшөөрсөн'
                                      : '✗ Татгалзсан'}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {/* Үнэлгээний Dialog */}
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
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium text-zinc-400">
                          Үнэлгээ өгсөн
                        </span>
                        <span className="text-sm font-semibold text-zinc-800">
                          {from}
                        </span>
                      </div>
                      <StarRow score={r.score} />
                    </div>
                    {r.job?.title && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium text-zinc-400">
                          Ажил
                        </span>
                        <span className="text-sm text-zinc-700 truncate">
                          {r.job.title}
                        </span>
                      </div>
                    )}
                    {r.comment && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-medium text-zinc-400">
                          Сэтгэгдэл
                        </span>
                        <p className="text-sm text-zinc-700 leading-relaxed">
                          {r.comment}
                        </p>
                      </div>
                    )}
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

      {/* Skills / Category / Availability Dialog */}
      <Dialog open={skillsDialog} onOpenChange={setSkillsDialog}>
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 border-b border-zinc-100">
            <DialogTitle className="text-base font-semibold text-zinc-900">
              Мэдээлэл засах
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Чадвар, чиглэл болон боломжит цагаа засна уу
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Star size={13} className="text-[#2872a1]" /> Миний чадвар
              </Label>
              <Input
                placeholder="Та өөрийн чадвараа оруулна уу..."
                value={editProfile.skills || ''}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, skills: e.target.value })
                }
                className="rounded-xl border-zinc-200 focus-visible:ring-[#2872A1]"
              />
              <p className="text-[11px] text-zinc-400">
                Таслалаар тусгаарлана уу
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Tag size={13} className="text-[#2872a1]" /> Сонирхож буй чиглэл
              </Label>
              <Select
                value={editCategory?.value || ''}
                onValueChange={(v) => setEditCategory({ value: v, label: v })}
              >
                <SelectTrigger className="rounded-xl border-zinc-200 focus:ring-[#2872A1] h-10 text-sm">
                  <SelectValue placeholder="Төрөл сонгох..." />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                <Clock size={13} className="text-[#2872a1]" /> Боломжит цаг
              </Label>

              <div className="space-y-2">
                {(profile.availabilities ?? []).length === 0 && (
                  <p className="text-xs text-zinc-400">
                    Цагийн хуваарь оруулаагүй
                  </p>
                )}
                {(profile.availabilities ?? []).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-100 bg-zinc-50"
                  >
                    <div className="flex items-center gap-2 text-xs text-zinc-700">
                      <span className="font-semibold w-16">
                        {
                          [
                            'Даваа',
                            'Мягмар',
                            'Лхагва',
                            'Пүрэв',
                            'Баасан',
                            'Бямба',
                            'Ням',
                          ][a.day - 1]
                        }
                      </span>
                      <span className="text-zinc-400">
                        {new Date(a.startTime).toLocaleTimeString('mn-MN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                        {' – '}
                        {new Date(a.endTime).toLocaleTimeString('mn-MN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteAvailability(a.id)}
                      className="text-zinc-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <p className="text-xs font-medium text-zinc-500">
                  Шинэ цаг нэмэх
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newAvail.day}
                    onChange={(e) =>
                      setNewAvail({ ...newAvail, day: Number(e.target.value) })
                    }
                    className="rounded-xl border border-zinc-200 text-xs px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#2872A1]"
                  >
                    {[
                      'Даваа',
                      'Мягмар',
                      'Лхагва',
                      'Пүрэв',
                      'Баасан',
                      'Бямба',
                      'Ням',
                    ].map((d, i) => (
                      <option key={i} value={i + 1}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <TimePicker
                    value={newAvail.startTime}
                    onChange={(v) => setNewAvail({ ...newAvail, startTime: v })}
                    size="xs"
                  />
                  <TimePicker
                    value={newAvail.endTime}
                    onChange={(v) => setNewAvail({ ...newAvail, endTime: v })}
                    size="xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={addAvailability}
                  className="w-full rounded-xl bg-[#2872a1] hover:bg-[#2872a1]/80 text-white gap-1.5 text-xs h-8"
                >
                  <Plus size={13} /> Нэмэх
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-zinc-100">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setSkillsDialog(false)}
            >
              Цуцлах
            </Button>
            <Button
              className="rounded-xl bg-[#2872A1] hover:bg-[#2872A1]/80"
              onClick={saveSkillsDialog}
            >
              Хадгалах
            </Button>
          </DialogFooter>
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
                {formatDate(r.job.startTime)} → {formatDate(r.job.endTime)}
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
