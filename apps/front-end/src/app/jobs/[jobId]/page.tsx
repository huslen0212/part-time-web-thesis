'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  employer?: {
    employerName?: string | null;
  };
};

export default function JobDetailPage() {
  const { jobId } = useParams();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/${jobId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Ажил олдсонгүй');
          return;
        }

        setJob(data);
      } catch {
        setError('Сервертэй холбогдож чадсангүй');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  if (loading) {
    return <p className="text-center py-20">Ачаалж байна...</p>;
  }

  if (error || !job) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.back()}>Буцах</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <p className="text-sm text-black/60">
                {job.employer?.employerName || 'Байгууллага'}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-black/80 whitespace-pre-line">
                {job.description}
              </p>

              <div className="space-y-2 text-sm">
                <div>
                  📍 <b>{job.location}</b>
                </div>
                <div>
                  🏷️ <b>{job.category}</b>
                </div>
                <div>
                  💰 <b>{job.salary.toLocaleString()} ₮</b>
                </div>
                <div>
                  ⏰ {new Date(job.startTime).toLocaleString('mn-MN')} –{' '}
                  {new Date(job.endTime).toLocaleString('mn-MN')}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => router.back()}>
                  Буцах
                </Button>
                <Button>Хүсэлт илгээх</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
