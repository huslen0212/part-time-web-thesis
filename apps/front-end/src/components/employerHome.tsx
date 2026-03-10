'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Users,
  Briefcase,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type EmployerRequest = {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  workerCount: number;
  job: {
    jobId: number;
    title: string;
    description: string;
  };
  jobSeeker: {
    userName?: string | null;
    phoneNumber?: string | null;
  };
};

// jobId => хамгийн эрт createdAt-ийг хадгална (ажлын огноог төлөөлүүлж)
type JobMeta = {
  jobId: number;
  title: string;
  description: string;
  firstCreatedAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function EmployerHome() {
  const router = useRouter();

  const [pending, setPending] = useState<EmployerRequest[]>([]);
  const [approved, setApproved] = useState<EmployerRequest[]>([]);
  const [rejected, setRejected] = useState<EmployerRequest[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/requests/employer`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: EmployerRequest[]) => {
        const sorted = data.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setPending(sorted.filter((r) => r.status === 'PENDING'));
        setApproved(sorted.filter((r) => r.status === 'APPROVED'));
        setRejected(sorted.filter((r) => r.status === 'REJECTED'));
      })
      .finally(() => setLoading(false));
  }, [router]);

  const updateStatus = async (
    request: EmployerRequest,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`${API_URL}/requests/${request.requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    setPending((prev) => prev.filter((r) => r.requestId !== request.requestId));
    const updated = { ...request, status };
    status === 'APPROVED'
      ? setApproved((prev) => [updated, ...prev])
      : setRejected((prev) => [updated, ...prev]);
  };

  // jobId бүрийн хамгийн эрт createdAt-ийг авна
  const jobsMap = new Map<number, JobMeta>();
  [...pending, ...approved, ...rejected].forEach((r) => {
    const existing = jobsMap.get(r.job.jobId);
    if (
      !existing ||
      new Date(r.createdAt) < new Date(existing.firstCreatedAt)
    ) {
      jobsMap.set(r.job.jobId, {
        ...r.job,
        firstCreatedAt: r.createdAt,
      });
    }
  });
  const jobs = Array.from(jobsMap.values());

  const filterByJob = (items: EmployerRequest[]) =>
    selectedJobId === 'ALL'
      ? items
      : items.filter((r) => r.job.jobId === selectedJobId);

  const totalAll = pending.length + approved.length + rejected.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm">Ачаалж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 overflow-hidden">
      {/* ── Top header ── */}
      <div className="bg-white border-b border-zinc-200 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                Хүсэлтийн самбар
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Нийт {totalAll} хүсэлт • {jobs.length} ажлын зар
              </p>
            </div>

            {/* Summary pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatPill
                icon={<Hourglass size={13} />}
                label="Хүлээгдэж буй"
                count={pending.length}
                color="yellow"
              />
              <StatPill
                icon={<CheckCircle2 size={13} />}
                label="Зөвшөөрсөн"
                count={approved.length}
                color="green"
              />
              <StatPill
                icon={<XCircle size={13} />}
                label="Татгалзсан"
                count={rejected.length}
                color="red"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="mt-4 max-w-sm">
            <Select
              value={String(selectedJobId)}
              onValueChange={(v) =>
                setSelectedJobId(v === 'ALL' ? 'ALL' : Number(v))
              }
            >
              <SelectTrigger className="rounded-xl border-zinc-200 bg-zinc-50 text-sm h-9">
                <div className="flex items-center gap-2">
                  <Briefcase size={13} className="text-zinc-400" />
                  <SelectValue placeholder="Ажил сонгох" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Бүх ажлууд</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.jobId} value={String(job.jobId)}>
                    <span className="flex items-center gap-2">
                      <span>{job.title}</span>
                      <span className="text-zinc-400 text-xs">
                        · {formatDate(job.firstCreatedAt)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Kanban board ── */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-6 h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full items-start">
            <KanbanColumn
              title="Хүлээгдэж буй"
              icon={<Hourglass size={14} />}
              items={filterByJob(pending)}
              color="yellow"
              onAction={updateStatus}
            />
            <KanbanColumn
              title="Зөвшөөрсөн"
              icon={<CheckCircle2 size={14} />}
              items={filterByJob(approved)}
              color="green"
            />
            <KanbanColumn
              title="Татгалзсан"
              icon={<XCircle size={14} />}
              items={filterByJob(rejected)}
              color="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── StatPill ─────────────────── */
function StatPill({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'yellow' | 'green' | 'red';
}) {
  const styles = {
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium',
        styles[color],
      )}
    >
      {icon}
      <span>{label}</span>
      <span className="font-bold">{count}</span>
    </div>
  );
}

/* ─────────────────── KanbanColumn ─────────────────── */
function KanbanColumn({
  title,
  icon,
  items,
  color,
  onAction,
}: {
  title: string;
  icon: React.ReactNode;
  items: EmployerRequest[];
  color: 'yellow' | 'green' | 'red';
  onAction?: (req: EmployerRequest, status: 'APPROVED' | 'REJECTED') => void;
}) {
  const headerStyles = {
    yellow: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-600',
  };
  const countStyles = {
    yellow: 'bg-amber-100 text-amber-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 max-h-full">
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2.5 rounded-xl border shrink-0',
          headerStyles[color],
        )}
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          {icon}
          {title}
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            countStyles[color],
          )}
        >
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-300 gap-2 border-2 border-dashed border-zinc-200 rounded-xl">
            <Users size={22} />
            <p className="text-xs">Хоосон байна</p>
          </div>
        )}
        {items.map((r) => (
          <RequestCard
            key={r.requestId}
            request={r}
            color={color}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── RequestCard ─────────────────── */
function RequestCard({
  request: r,
  color,
  onAction,
}: {
  request: EmployerRequest;
  color: 'yellow' | 'green' | 'red';
  onAction?: (req: EmployerRequest, status: 'APPROVED' | 'REJECTED') => void;
}) {
  const borderStyles = {
    yellow: 'border-zinc-200 hover:border-amber-300',
    green: 'border-emerald-200 hover:border-emerald-300',
    red: 'border-red-200 hover:border-red-300',
  };

  return (
    <Card
      className={cn(
        'shadow-none rounded-2xl border transition-colors bg-white shrink-0',
        borderStyles[color],
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            {r.job.title}
          </p>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {r.job.description}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <User size={11} className="text-zinc-500" />
            </div>
            <span className="font-medium">
              {r.jobSeeker.userName || 'Нэргүй'}
            </span>
            <span className="text-zinc-400">·</span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Users size={11} />
              {r.workerCount} хүн
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <Phone size={11} className="text-zinc-500" />
            </div>
            <span>{r.jobSeeker.phoneNumber || '—'}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              <Clock size={11} className="text-zinc-500" />
            </div>
            <span>
              {new Date(r.createdAt).toLocaleString('mn-MN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
          </div>
        </div>

        {r.status === 'PENDING' && onAction && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                onClick={() => onAction(r, 'APPROVED')}
              >
                <Check size={13} /> Зөвшөөрөх
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 gap-1.5"
                onClick={() => onAction(r, 'REJECTED')}
              >
                <X size={13} /> Татгалзах
              </Button>
            </div>
          </>
        )}

        {r.status !== 'PENDING' && (
          <div
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium',
              r.status === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600',
            )}
          >
            {r.status === 'APPROVED' ? (
              <CheckCircle2 size={12} />
            ) : (
              <XCircle size={12} />
            )}
            {r.status === 'APPROVED' ? 'Зөвшөөрөгдсөн' : 'Татгалзагдсан'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
