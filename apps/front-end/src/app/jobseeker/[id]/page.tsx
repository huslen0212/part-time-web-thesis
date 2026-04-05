'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  MapPin,
  CalendarDays,
  Briefcase,
  Star,
  Building2,
  Clock,
  Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type WorkItem = {
  createdAt: string;
  job: {
    title: string;
    category: string;
    location: string;
    salary: number;
    startTime: string;
    endTime: string;
    employer?: { employerName?: string | null };
  };
};

type RatingItem = {
  score: number;
  comment: string | null;
  createdAt: string;
  job?: { title?: string | null } | null;
  fromUser?: {
    jobSeeker?: { userName?: string | null } | null;
    employer?: { employerName?: string | null } | null;
  };
};

type Profile = {
  userName: string | null;
  phoneNumber: string | null;
  gender: string | null;
  address: string | null;
  createdAt: string;
  workHistory: WorkItem[];
  rating: {
    average: number | null;
    count: number;
    items: RatingItem[];
  };
};

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(d: string) {
  const date = new Date(d);
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

export default function JobSeekerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/profile/jobseeker/${id}`)
      .then((r) => r.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header />
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          Хэрэглэгч олдсонгүй
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 max-w-screen-lg mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* ── Left: Profile card ── */}
          <div className="flex flex-col gap-4">
            <Card className="shadow-none rounded-2xl border-zinc-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="h-16" />

                <div className="flex flex-col items-center -mt-7 pb-5 px-6">
                  <p className="font-bold text-zinc-900 mt-3 text-center text-base">
                    {profile.userName || 'Нэргүй'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">Ажил хайгч</p>
                </div>

                {/* Үнэлгээ */}
                <div className="flex flex-col items-center gap-1 pb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={cn(
                          profile.rating.average &&
                            s <= Math.round(profile.rating.average)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-200 fill-zinc-200',
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {profile.rating.average !== null
                      ? `${profile.rating.average.toFixed(1)} (${profile.rating.count} үнэлгээ)`
                      : 'Үнэлгээ байхгүй'}
                  </p>
                </div>

                <Separator />

                <div className="px-5 py-4 space-y-3">
                  <InfoRow
                    icon={<User size={13} />}
                    label="Нэр"
                    value={profile.userName}
                  />
                  <InfoRow
                    icon={<Phone size={13} />}
                    label="Утас"
                    value={profile.phoneNumber}
                  />
                  <InfoRow
                    icon={<MapPin size={13} />}
                    label="Хаяг"
                    value={profile.address}
                  />
                  <InfoRow
                    icon={<CalendarDays size={13} />}
                    label="Бүртгүүлсэн"
                    value={formatDate(profile.createdAt)}
                  />
                  <InfoRow
                    icon={<Briefcase size={13} />}
                    label="Гүйцэтгэсэн ажил"
                    value={`${profile.workHistory.length} ажил`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right ── */}
          <div className="flex flex-col gap-8">
            {/* Work history */}
            <div>
              <h2 className="text-base font-bold text-zinc-900 mb-4">
                Ажлын түүх
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  {profile.workHistory.length} ажил
                </span>
              </h2>

              {profile.workHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <Briefcase size={24} />
                  <p className="text-xs">Ажлын түүх байхгүй</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.workHistory.map((w, i) => (
                    <Card
                      key={i}
                      className="shadow-none rounded-2xl border-zinc-200 bg-white"
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900 leading-tight">
                            {w.job.title}
                          </p>
                          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-1 rounded-lg shrink-0 font-medium">
                            {w.job.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Building2 size={11} className="text-zinc-400" />
                            {w.job.employer?.employerName || 'Байгууллага'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <MapPin size={11} className="text-zinc-400" />
                            {w.job.location}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Banknote size={11} className="text-zinc-400" />
                            {w.job.salary.toLocaleString()}₮
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Clock size={11} />
                          {formatDateTime(w.job.startTime)} →{' '}
                          {formatDateTime(w.job.endTime)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings */}
            <div>
              <h2 className="text-base font-bold text-zinc-900 mb-4">
                Үнэлгээнүүд
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  {profile.rating.count} үнэлгээ
                </span>
              </h2>

              {profile.rating.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <Star size={24} />
                  <p className="text-xs">Үнэлгээ байхгүй</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.rating.items.map((r, i) => {
                    const from =
                      r.fromUser?.employer?.employerName ||
                      r.fromUser?.jobSeeker?.userName ||
                      'Хэрэглэгч';
                    return (
                      <Card
                        key={i}
                        className="shadow-none rounded-2xl border-zinc-200 bg-white"
                      >
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-700">
                              {from}
                            </span>
                            <StarRow score={r.score} />
                          </div>
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
                          {r.comment && (
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              {r.comment}
                            </p>
                          )}
                          <p className="text-[10px] text-zinc-400">
                            {formatDate(r.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InfoRow({
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
