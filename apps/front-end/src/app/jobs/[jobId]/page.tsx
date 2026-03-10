'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Building2,
  DollarSign,
  Tag,
  MapPin,
  Users,
  ArrowLeft,
  Send,
  Clock,
} from 'lucide-react';
import JobLocationMap from '@/components/JobLocationMap';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type Job = {
  jobId: number;
  title: string;
  description: string;
  category: string;
  location: string;
  salary: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  latitude?: number | null;
  longitude?: number | null;
  numberOfWorker: number;
  employer?: { employerName?: string | null };
};

const CATEGORY_COLORS: Record<string, string> = {
  Үйлчилгээ: 'bg-blue-50 text-blue-700 border-blue-200',
  Маркетинг: 'bg-purple-50 text-purple-700 border-purple-200',
  IT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Оффис: 'bg-amber-50 text-amber-700 border-amber-200',
  Хүргэлт: 'bg-orange-50 text-orange-700 border-orange-200',
  Барилга: 'bg-zinc-100 text-zinc-700 border-zinc-200',
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

function InfoItem({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-400 font-medium mb-0.5">{label}</p>
        <p className={cn('text-sm font-semibold text-zinc-800', valueClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.jobId);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState(1);

  const handleSendRequest = async (workerCount: number) => {
    const clamped = Math.max(
      1,
      Math.min(workerCount, job?.numberOfWorker || 1),
    );
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId, workerCount: clamped }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Алдаа гарлаа');
        return;
      }
      toast.success('Хүсэлт амжилттай илгээгдлээ');
      setRequestDialogOpen(false);
    } catch {
      toast.error('Сервертэй холбогдож чадсангүй');
    }
  };

  const openRequestDialog = () => {
    if (job && job.numberOfWorker > 1) setRequestDialogOpen(true);
    else handleSendRequest(1);
  };

  useEffect(() => {
    if (isNaN(jobId)) return;
    fetch(`${API_URL}/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.jobId) setJob(data);
        else setError(data.message || 'Ажил олдсонгүй');
      })
      .catch(() => setError('Сервертэй холбогдож чадсангүй'))
      .finally(() => setLoading(false));
  }, [jobId]);

  /* ── Loading ── */
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

  /* ── Error ── */
  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-400">
          <p className="text-red-500 text-sm">{error || 'Ажил олдсонгүй'}</p>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft size={15} /> Буцах
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const hasMap = !!job.latitude && !!job.longitude;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-6"
          >
            <ArrowLeft size={15} />
            Буцах
          </button>

          <div
            className={cn(
              'grid gap-6 items-start',
              hasMap
                ? 'grid-cols-1 lg:grid-cols-[1fr_380px]'
                : 'grid-cols-1 max-w-2xl',
            )}
          >
            {/* ── Left: detail ── */}
            <div className="flex flex-col gap-5">
              {/* Title card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
                    {job.title}
                  </h1>
                  <span
                    className={cn(
                      'text-xs font-medium px-3 py-1 rounded-full border shrink-0 mt-1',
                      CATEGORY_COLORS[job.category] ??
                        'bg-zinc-100 text-zinc-600 border-zinc-200',
                    )}
                  >
                    {job.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <Building2 size={14} />
                  <span>{job.employer?.employerName || 'Байгууллага'}</span>
                </div>
              </div>

              {/* Description card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                  Тайлбар
                </p>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>

              {/* Info card */}
              <div className="bg-white rounded-2xl border border-zinc-200 px-6 divide-y divide-zinc-100">
                <InfoItem
                  icon={<MapPin size={15} />}
                  label="Байршил"
                  value={job.location}
                />
                <InfoItem
                  icon={<DollarSign size={15} />}
                  label="Цалин"
                  value={`${job.salary.toLocaleString()} ₮`}
                  valueClass="text-emerald-700"
                />
                <InfoItem
                  icon={<Users size={15} />}
                  label="Авах ажилчдын тоо"
                  value={`${job.numberOfWorker} хүн`}
                />
                <InfoItem
                  icon={<Tag size={15} />}
                  label="Төрөл"
                  value={job.category}
                />
                <InfoItem
                  icon={<Clock size={15} />}
                  label="Цаг хугацаа"
                  value={
                    <span>
                      {formatDate(job.startTime)}
                      <span className="mx-1.5 text-zinc-300">→</span>
                      {formatDate(job.endTime)}
                    </span>
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 rounded-xl bg-[#2872a1] hover:bg-[#7f9db1] gap-2 h-12 font-semibold"
                  onClick={openRequestDialog}
                >
                  <Send size={16} />
                  Хүсэлт илгээх
                </Button>
              </div>
            </div>

            {/* ── Right: map ── */}
            {hasMap && (
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <p className="text-sm font-semibold text-zinc-700">
                    Байршил газрын зураг дээр
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{job.location}</p>
                </div>
                <div className="h-[360px]">
                  <JobLocationMap
                    lat={job.latitude || 0}
                    lng={job.longitude || 0}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Request Dialog ── */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Хүсэлт илгээх
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <p className="text-sm text-zinc-500">
              Хэдэн хүний хүсэлт илгээх вэ?
            </p>

            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400 font-medium">
                  Тоо сонгох
                </span>
                <span className="text-xs text-zinc-400">
                  Дээд хязгаар: {job.numberOfWorker}
                </span>
              </div>
              <Input
                type="number"
                min={1}
                max={job.numberOfWorker}
                value={selectedWorkers}
                onChange={(e) => {
                  const val = Number(e.target.value) || 1;
                  setSelectedWorkers(
                    Math.max(1, Math.min(val, job.numberOfWorker)),
                  );
                }}
                className="rounded-xl border-zinc-200 focus-visible:ring-[#2872a1] text-center text-lg font-semibold"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => setRequestDialogOpen(false)}
            >
              Болих
            </Button>
            <Button
              className="rounded-xl flex-1 bg-[#2872a1] hover:bg-[#7f9db1] gap-1.5"
              onClick={() => handleSendRequest(selectedWorkers)}
            >
              <Send size={14} />
              Илгээх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
