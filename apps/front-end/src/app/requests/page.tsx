'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Phone, User, Calendar } from 'lucide-react';

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

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<EmployerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/requests/employer`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Хүсэлтүүдийг ачаалж чадсангүй');
          return;
        }

        setRequests(data);
      } catch {
        setError('Сервертэй холбогдож чадсангүй');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-xl font-semibold mb-6">Ирсэн хүсэлтүүд</h1>

          {loading && <p>Ачаалж байна...</p>}

          {!loading && error && <p className="text-red-500">{error}</p>}

          {!loading && !error && requests.length === 0 && (
            <p className="text-black/60">Одоогоор ирсэн хүсэлт байхгүй байна</p>
          )}

          <div className="space-y-4">
            {requests.map((r) => (
              <Card key={r.requestId}>
                <CardHeader>
                  <CardTitle className="text-base">{r.job.title}</CardTitle>
                </CardHeader>

                <CardContent className="text-sm text-black/60">
                  {r.job.description ? (
                    <p>{r.job.description}</p>
                  ) : (
                    <p className="italic text-black/40">
                      Ажлын тайлбар оруулаагүй
                    </p>
                  )}
                </CardContent>

                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <b>{r.jobSeeker.userName || 'Нэргүй'}</b>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <div>{r.jobSeeker.phoneNumber || '-'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <span className="font-medium">{r.status}</span>
                  </div>

                  <div className="text-xs text-black/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(r.createdAt).toLocaleString('mn-MN')}
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/jobs/${r.job.jobId}`)}
                    >
                      Ажлын дэлгэрэнгүй
                    </Button>

                    {r.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Зөвшөөрөх
                        </Button>

                        <Button size="sm" variant="destructive">
                          Татгалзах
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
