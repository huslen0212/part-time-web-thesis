'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar, MapPin, List } from 'lucide-react';
import ApprovedJobsCalendar from '@/components/ApprovedJobsCalendar';

const API_URL = 'http://localhost:3001';

type Profile = {
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
};

type MyRequest = {
  requestId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCEL';
  createdAt: string;
  job: {
    jobId: number;
    title: string;
    location: string;
    description?: string | null;
    category: string;
    startTime: string;
    endTime: string;
  };
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    email: '',
    userName: '',
    phoneNumber: '',
  });

  const [editProfile, setEditProfile] = useState<Profile>({
    email: '',
    userName: '',
    phoneNumber: '',
  });

  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/profile`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/requests/me`, { headers }).then((r) => r.json()),
    ])
      .then(([profileData, requestData]) => {
        setProfile(profileData);
        setEditProfile({
          email: profileData.email || '',
          userName: profileData.userName || '',
          phoneNumber: profileData.phoneNumber || '',
        });
        setRequests(requestData);
      })
      .catch(() => toast.error('Мэдээлэл ачаалж чадсангүй'))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editProfile),
    });

    if (res.ok) {
      setProfile(editProfile);
      toast.success('Мэдээлэл амжилттай хадгалагдлаа');
    } else {
      toast.error('Хадгалах үед алдаа гарлаа');
    }
  };

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

      <main className="flex-1 max-w-screen-2xl mx-auto px-6 py-10 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
          <Card className="self-start h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Миний профайл</CardTitle>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Засах
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 space-y-4">
                  <h4 className="font-medium">Профайл засах</h4>

                  <div className="space-y-2">
                    <Label>Имэйл</Label>
                    <Input
                      value={editProfile.email || ''}
                      onChange={(e) =>
                        setEditProfile({
                          ...editProfile,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Нэр</Label>
                    <Input
                      value={editProfile.userName || ''}
                      onChange={(e) =>
                        setEditProfile({
                          ...editProfile,
                          userName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Утас</Label>
                    <Input
                      value={editProfile.phoneNumber || ''}
                      onChange={(e) =>
                        setEditProfile({
                          ...editProfile,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button className="w-full" onClick={saveProfile}>
                    Хадгалах
                  </Button>
                </PopoverContent>
              </Popover>
            </CardHeader>

            <CardContent className="grid gap-4 text-sm">
              <ProfileRow label="Имэйл" value={profile.email} />
              <ProfileRow label="Нэр" value={profile.userName} />
              <ProfileRow label="Утас" value={profile.phoneNumber} />
            </CardContent>
          </Card>

          {/* REQUESTS */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Миний илгээсэн хүсэлтүүд</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <RequestColumn
                title={`Хүлээгдэж (${pending.length})`}
                items={pending}
              />
              <RequestColumn
                title={`Зөвшөөрсөн (${approved.length})`}
                items={approved}
                highlight="green"
              />
              <RequestColumn
                title={`Татгалзсан (${rejected.length})`}
                items={rejected}
                highlight="red"
              />
              <RequestColumn
                title={`Цуцлагдсан (${cancelled.length})`}
                items={cancelled}
                highlight="gray"
              />
            </div>
          </section>

          {approved.length > 0 && (
            <section className="col-span-1 lg:col-span-2 w-3/4 mx-auto">
              <div className="-mx-6 px-6">
                <h2 className="text-2xl font-semibold mb-6">
                  Миний зөвшөөрөгдсөн ажлууд
                </h2>

                <ApprovedJobsCalendar items={approved} />
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- helpers ---------- */

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-black/60">{label}</span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  );
}

function RequestColumn({
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

              <div className="flex items-start gap-2 text-black/60">
                <span className="text-xs line-clamp-2">
                  {r.job.description}
                </span>
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
