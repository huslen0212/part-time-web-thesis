'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const API_URL = 'http://localhost:3001';

type Profile = {
  email?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
};

type MyRequest = {
  requestId: number;
  status: string;
  createdAt: string;
  job: {
    jobId: number;
    title: string;
    location: string;
    description?: string | null;
  };
};

export default function ProfilePage() {
  const router = useRouter();

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
      router.push('/login');
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

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
      .catch(() => {
        toast.error('Мэдээлэл ачаалж чадсангүй');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const saveProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: editProfile.email,
        userName: editProfile.userName,
        phoneNumber: editProfile.phoneNumber,
      }),
    });

    if (res.ok) {
      setProfile(editProfile);
      toast.success('Мэдээлэл амжилттай хадгалагдлаа');
    } else {
      toast.error('Хадгалах үед алдаа гарлаа');
    }
  };

  if (loading) {
    return <p className="text-center py-20">Ачаалж байна...</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
          <div>
            <Card>
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
                <div className="flex justify-between">
                  <span className="text-black/60">Имэйл</span>
                  <span className="font-medium">{profile.email || '-'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-black/60">Нэр</span>
                  <span className="font-medium">{profile.userName || '-'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-black/60">Утас</span>
                  <span className="font-medium">
                    {profile.phoneNumber || '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold">Миний илгээсэн хүсэлтүүд</h2>

            {requests.length === 0 && (
              <p className="text-sm text-black/60">
                Одоогоор хүсэлт илгээгээгүй байна
              </p>
            )}

            {requests.map((r) => (
              <Card
                key={r.requestId}
                className="w-full hover:shadow-lg transition cursor-pointer"
                onClick={() => router.push(`/jobs/${r.job.jobId}`)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{r.job.title}</h3>
                      <p className="text-sm text-black/60">{r.job.location}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-block rounded-full border px-3 py-1 text-xs font-medium">
                        {r.status}
                      </span>
                      <div className="text-xs text-black/50 mt-1">
                        {new Date(r.createdAt).toLocaleDateString('mn-MN')}
                      </div>
                    </div>
                  </div>

                  {r.job.description && (
                    <p className="text-sm text-black/80 line-clamp-2">
                      {r.job.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
