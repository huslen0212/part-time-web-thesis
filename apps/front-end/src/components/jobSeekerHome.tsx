'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, DollarSign, List, MapPin } from 'lucide-react';

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

export default function JobSeekerHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/jobs`)
      .then((res) => res.json())
      .then((data) => setJobs(data))
      .catch(() => setError('Сервертэй холбогдож чадсангүй'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
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
            <Link key={job.jobId} href={`/jobs/${job.jobId}`} className="block">
              <Card className="border-black/10 relative cursor-pointer hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-lg">{job.title}</CardTitle>

                  <p className="flex items-center gap-2 text-sm text-black/60">
                    <Building2 className="w-4 h-4" />
                    {job.employer?.employerName || 'Байгууллага'}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 pb-10">
                  {/* тайлбар */}
                  <p className="text-sm text-black/70 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{job.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span className="font-medium">{job.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">
                        {job.salary.toLocaleString()} ₮
                      </span>
                    </div>

                    {/* эхлэх / дуусах */}
                    <div className="flex items-start gap-2 text-black/60">
                      <Calendar className="w-4 h-4 mt-1" />
                      <div className="flex flex-col">
                        <span>
                          Эхлэх:{' '}
                          {new Date(job.startTime).toLocaleString('mn-MN')}
                        </span>
                        <span>
                          Дуусах:{' '}
                          {new Date(job.endTime).toLocaleString('mn-MN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* нийтэлсэн огноо */}
                  <div className="absolute bottom-3 right-4 text-xs text-black/50 flex items-center gap-1">
                    🗓️
                    {new Date(job.createdAt).toLocaleString('mn-MN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
