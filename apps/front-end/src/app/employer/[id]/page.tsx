'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Phone,
  CalendarDays,
  Briefcase,
  Star,
  MapPin,
  Banknote,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type JobItem = {
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

type RatingItem = {
  score: number;
  comment: string | null;
  createdAt: string;
  job?: { title?: string | null } | null;
  fromUser?: {
    jobSeeker?: { userName?: string | null } | null;
  };
};

type EmployerPublic = {
  employerName: string | null;
  phoneNumber: string | null;
  createdAt: string;
  jobs: JobItem[];
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

const CATEGORY_COLORS: Record<string, string> = {
  Үйлчилгээ: 'bg-blue-50 text-blue-700',
  Маркетинг: 'bg-purple-50 text-purple-700',
  IT: 'bg-emerald-50 text-emerald-700',
  Оффис: 'bg-amber-50 text-amber-700',
  Хүргэлт: 'bg-orange-50 text-orange-700',
  Барилга: 'bg-zinc-100 text-zinc-700',
};

export default function EmployerPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EmployerPublic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/employer/${id}`)
      .then((r) => r.json())
      .then(setData)
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

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header />
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          Байгууллага олдсонгүй
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
                    {data.employerName || '—'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">Ажил олгогч</p>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-center gap-1 pb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={cn(
                          data.rating.average &&
                            s <= Math.round(data.rating.average)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-200 fill-zinc-200',
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {data.rating.average !== null
                      ? `${data.rating.average.toFixed(1)} (${data.rating.count} үнэлгээ)`
                      : 'Үнэлгээ байхгүй'}
                  </p>
                </div>

                <Separator />

                <div className="px-5 py-4 space-y-3">
                  <InfoRow
                    icon={<Building2 size={13} />}
                    label="Байгууллага"
                    value={data.employerName}
                  />
                  <InfoRow
                    icon={<Phone size={13} />}
                    label="Утас"
                    value={data.phoneNumber}
                  />
                  <InfoRow
                    icon={<CalendarDays size={13} />}
                    label="Бүртгүүлсэн"
                    value={formatDate(data.createdAt)}
                  />
                  <InfoRow
                    icon={<Briefcase size={13} />}
                    label="Нийт зар"
                    value={`${data.jobs.length} зар`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Right ── */}
          <div className="flex flex-col gap-8">
            {/* Job listings */}
            <div>
              <h2 className="text-base font-bold text-zinc-900 mb-4">
                Ажлын зарууд
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  {data.jobs.length} зар
                </span>
              </h2>

              {data.jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <Briefcase size={24} />
                  <p className="text-xs">Зар байхгүй</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.jobs.map((job) => (
                    <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
                      <Card className="shadow-none rounded-2xl border-zinc-200 hover:border-[#2872a1] hover:shadow-sm transition-all bg-white cursor-pointer h-full">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-900 leading-tight line-clamp-2 flex-1">
                              {job.title}
                            </p>
                            <span
                              className={cn(
                                'text-[10px] px-2 py-1 rounded-lg shrink-0 font-medium',
                                CATEGORY_COLORS[job.category] ??
                                  'bg-zinc-100 text-zinc-600',
                              )}
                            >
                              {job.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <MapPin size={10} className="text-zinc-400" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Banknote size={10} className="text-zinc-400" />
                              {job.salary.toLocaleString()}₮
                            </span>
                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                              <Users size={10} className="text-zinc-400" />
                              {job._count.requests} хүсэлт
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Clock size={10} />
                            {formatDateTime(job.startTime)} →{' '}
                            {formatDateTime(job.endTime)}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings */}
            <div>
              <h2 className="text-base font-bold text-zinc-900 mb-4">
                Үнэлгээнүүд
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  {data.rating.count} үнэлгээ
                </span>
              </h2>

              {data.rating.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-300 gap-2 border-2 border-dashed border-zinc-200 rounded-2xl">
                  <Star size={24} />
                  <p className="text-xs">Үнэлгээ байхгүй</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.rating.items.map((r, i) => (
                    <Card
                      key={i}
                      className="shadow-none rounded-2xl border-zinc-200 bg-white"
                    >
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-700">
                            {r.fromUser?.jobSeeker?.userName || 'Хэрэглэгч'}
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
                  ))}
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
