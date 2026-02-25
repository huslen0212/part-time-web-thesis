'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, Calendar, DollarSign, List, MapPin } from 'lucide-react';
import JobLocationMap from '@/components/JobLocationMap';

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
  employer?: {
    employerName?: string | null;
  };
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.jobId);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sendRequest = async () => {
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
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Алдаа гарлаа');
        return;
      }

      toast.success('Хүсэлт амжилттай илгээгдлээ');
    } catch {
      toast.error('Сервертэй холбогдож чадсангүй');
    }
  };

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

    if (!isNaN(jobId)) {
      fetchJob();
    }
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
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* LEFT: DETAIL CARD */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <p className="text-sm text-black/60 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {job.employer?.employerName || 'Байгууллага'}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-black/80 whitespace-pre-line">
                  {job.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <b>{job.location}</b>
                  </div>

                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <b>{job.category}</b>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <b>{job.salary.toLocaleString()} ₮</b>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(job.startTime).toLocaleString('mn-MN')} –{' '}
                    {new Date(job.endTime).toLocaleString('mn-MN')}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    Буцах
                  </Button>
                  <Button onClick={sendRequest}>Хүсэлт илгээх</Button>
                </div>
              </CardContent>
            </Card>

            {/* RIGHT: MAP CARD */}
            {job.latitude && job.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Байршил газрын зураг дээр
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <JobLocationMap lat={job.latitude} lng={job.longitude} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
