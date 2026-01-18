'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, List } from 'lucide-react';

const API_URL = 'http://localhost:3001';

type MyRequest = {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCEL';
  createdAt: string;
  job: {
    jobId: number;
    title: string;
    location: string;
    category: string;
    startTime: string;
    endTime: string;
  };
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetch(`${API_URL}/requests/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .finally(() => setLoading(false));
  }, []);

  const pending = requests.filter((r) => r.status === 'PENDING');
  const approved = requests.filter((r) => r.status === 'APPROVED');
  const rejected = requests.filter((r) => r.status === 'REJECTED');
  const cancelled = requests.filter((r) => r.status === 'CANCEL');

  if (loading) {
    return <p className="text-center py-20">Ачаалж байна...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8 text-center">
          Миний илгээсэн хүсэлтүүд
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Column title={`Хүлээгдэж (${pending.length})`} items={pending} />
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
          <Column
            title={`Цуцлагдсан (${cancelled.length})`}
            items={cancelled}
            highlight="gray"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Column({
  title,
  items,
  highlight,
}: {
  title: string;
  items: MyRequest[];
  highlight?: 'green' | 'red' | 'gray';
}) {
  const border =
    highlight === 'green'
      ? 'border-green-200'
      : highlight === 'red'
        ? 'border-red-200'
        : highlight === 'gray'
          ? 'border-gray-300'
          : '';

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>

      {items.length === 0 && <p className="text-sm text-black/50">Хоосон</p>}

      {items.map((r) => (
        <Link key={r.requestId} href={`/jobs/${r.job.jobId}`} className="block">
          <Card
            className={`${border} cursor-pointer hover:shadow-md transition`}
          >
            <CardHeader>
              <CardTitle className="text-sm">{r.job.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              {/* Location */}
              <div className="flex items-center gap-2 text-black/60">
                <MapPin className="w-4 h-4" />
                {r.job.location}
              </div>

              {/* Category */}
              <div className="flex items-center gap-2 text-black/60">
                <List className="w-4 h-4" />
                {r.job.category}
              </div>

              {/* Sent time */}
              <div className="flex items-center gap-2 text-xs text-black/50">
                <Calendar className="w-4 h-4" />
                Илгээсэн: {new Date(r.createdAt).toLocaleString('mn-MN')}
              </div>

              {/* Start - End time */}
              <div className="flex items-start gap-2 text-black/60">
                <div className="flex flex-col">
                  <span>
                    Эхлэх: {new Date(r.job.startTime).toLocaleString('mn-MN')}
                  </span>
                  <span>
                    Дуусах: {new Date(r.job.endTime).toLocaleString('mn-MN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
