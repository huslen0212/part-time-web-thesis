'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = 'http://localhost:3001';

/* ===== Types ===== */
type Job = {
  jobId: number;
  title: string;
  description: string;
  category: string;
  location: string;
  salary: number;
  startTime: string;
  endTime: string;
  employer?: {
    employerName?: string | null;
  };
};

export default function JobSeekerHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Ажил татаж чадсангүй');
          return;
        }

        setJobs(data);
      } catch {
        setError('Сервертэй холбогдож чадсангүй');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <>
      {/* ================= Hero ================= */}
      <section className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-bold mb-4">Цагийн ажил хайх</h2>
          <p className="max-w-3xl mx-auto mb-8 text-black/70">
            Өөрийн боломжит цагт тохирох ажлыг хурдан, хялбараар олоорой
          </p>

          <Link href="/calendar">
            <Button variant="outline" size="lg">
              Календарь харах
            </Button>
          </Link>
        </div>
      </section>

      {/* ================= Jobs ================= */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-semibold mb-8">Нээлттэй ажлууд</h3>

          {loading && (
            <p className="text-center text-black/60">Ачаалж байна...</p>
          )}

          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && jobs.length === 0 && (
            <p className="text-center text-black/60">
              Одоогоор нээлттэй ажил байхгүй
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={job.jobId} className="border-black/10">
                <CardHeader>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <p className="text-sm text-black/60">
                    {job.employer?.employerName || 'Байгууллага'}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-black/70 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="text-sm space-y-1">
                    <div>
                      📍 <span className="font-medium">{job.location}</span>
                    </div>
                    <p className="text-sm text-black/70 line-clamp-3">
                      <span className="font-medium">{job.category}</span>
                    </p>
                    <div>
                      💰{' '}
                      <span className="font-medium">
                        {job.salary.toLocaleString()} ₮
                      </span>
                    </div>
                    <div className="text-black/60">
                      ⏰ {new Date(job.startTime).toLocaleString()} –{' '}
                      {new Date(job.endTime).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="w-full">
                      Дэлгэрэнгүй
                    </Button>
                    <Button className="w-full">Хүсэлт илгээх</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
