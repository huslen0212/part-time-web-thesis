'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Phone, Calendar } from 'lucide-react';

const API_URL = 'http://localhost:3001';

type EmployerRequest = {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
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

export default function EmployerHome() {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===== Fetch + sort (newest first) ===== */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`${API_URL}/requests/employer`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data: EmployerRequest[]) =>
        setRequests(
          data.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [router]);

  const updateStatus = async (
    requestId: number,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`${API_URL}/requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    setRequests((prev) =>
      prev.map((r) => (r.requestId === requestId ? { ...r, status } : r)),
    );
  };

  const approved = requests.filter((r) => r.status === 'APPROVED');
  const rejected = requests.filter((r) => r.status === 'REJECTED');

  if (loading) {
    return <p className="text-center py-20">Ачаалж байна...</p>;
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold mb-10 text-center">
          Ажил олгогчийн хүсэлтийн самбар
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Column
            title={`Бүх хүсэлтүүд (${requests.length})`}
            items={requests}
            onAction={updateStatus}
          />

          <Column
            title={`Зөвшөөрсөн (${approved.length})`}
            items={approved}
            highlight="green"
          />

          <Column
            title={`Татгалзсан (${rejected.length})`}
            items={rejected}
            highlight="red"
          />
        </div>
      </div>
    </section>
  );
}

function Column({
  title,
  items,
  highlight,
  onAction,
}: {
  title: string;
  items: EmployerRequest[];
  highlight?: 'green' | 'red';
  onAction?: (id: number, status: 'APPROVED' | 'REJECTED') => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>

      {items.length === 0 && (
        <p className="text-sm text-black/50">Хоосон байна</p>
      )}

      {items.map((r) => (
        <Card
          key={r.requestId}
          className={
            highlight === 'green'
              ? 'border-green-200'
              : highlight === 'red'
                ? 'border-red-200'
                : ''
          }
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm">{r.job.title}</CardTitle>

            {/* ===== CREATED AT ===== */}
            <p className="text-xs text-black/50 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Ирсэн: {new Date(r.createdAt).toLocaleString('mn-MN')}
            </p>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {/* ===== DESCRIPTION ===== */}
            {r.job.description ? (
              <p className="text-black/70">{r.job.description}</p>
            ) : (
              <p className="italic text-black/40">Ажлын тайлбар оруулаагүй</p>
            )}

            {/* ===== JOB SEEKER ===== */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{r.jobSeeker.userName || 'Нэргүй'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{r.jobSeeker.phoneNumber || '-'}</span>
            </div>

            {/* ===== ACTIONS ===== */}
            {r.status === 'PENDING' && onAction && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => onAction(r.requestId, 'APPROVED')}
                >
                  Зөвшөөрөх
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onAction(r.requestId, 'REJECTED')}
                >
                  Татгалзах
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
