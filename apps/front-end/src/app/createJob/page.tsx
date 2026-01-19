'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const API_URL = 'http://localhost:3001';

type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  exp: number;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

type JobTemplate = {
  jobId: number;
  title: string;
  description: string;
  location: string;
  category: string;
  salary: number;
  startTime: string;
  endTime: string;
};

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<JobTemplate | null>(
    null,
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    const decoded = decodeToken(token);
    if (!decoded || decoded.exp < Date.now() / 1000) {
      localStorage.removeItem('token');
      return router.push('/login');
    }

    fetch(`${API_URL}/jobs/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => toast.error('Template ажлууд ачаалж чадсангүй'));
  }, [router]);

  const applyTemplate = (job: JobTemplate) => {
    setTitle(job.title);
    setDescription(job.description);
    setLocation(job.location);
    setCategory(job.category);
    setSalary(job.salary);
    setStartTime(job.startTime);
    setEndTime(job.endTime);
    setActiveTemplate(null);
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !location ||
      !category ||
      salary === '' ||
      !startTime ||
      !endTime
    ) {
      toast.warning('Бүх талбарыг бөглөнө үү');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title,
          description,
          location,
          category,
          salary: Number(salary),
          startTime,
          endTime,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Ажил амжилттай нэмэгдлээ');
      router.push('/');
    } catch {
      toast.error('Ажил нэмэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* FORM */}
          <Card>
            <CardHeader>
              <CardTitle>Шинэ ажил нэмэх</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Field label="Ажлын гарчиг">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>

              <Field label="Тайлбар">
                <Textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <Field label="Байршил">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Field>

              <Field label="Төрөл">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Үйлчилгээ">Үйлчилгээ</SelectItem>
                    <SelectItem value="Маркетинг">Маркетинг</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Оффис">Оффис</SelectItem>
                    <SelectItem value="Хүргэлт">Хүргэлт</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Цалин">
                <Input
                  type="number"
                  value={salary}
                  onChange={(e) =>
                    setSalary(e.target.value ? Number(e.target.value) : '')
                  }
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Эхлэх цаг">
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </Field>

                <Field label="Дуусах цаг">
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </Field>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Хадгалж байна...' : 'Ажил нэмэх'}
              </Button>
            </CardContent>
          </Card>

          {/* TEMPLATE LIST */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-black/70">
              Өмнөх ажлууд (Template)
            </h3>

            {templates.map((job) => (
              <Card
                key={job.jobId}
                className="cursor-pointer hover:shadow-md transition"
                onClick={() => setActiveTemplate(job)}
              >
                <CardContent className="p-4">
                  <div className="font-medium text-sm">{job.title}</div>
                  <div className="text-xs text-black/50">
                    {job.category} · {job.location}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* TEMPLATE DIALOG */}
      <Dialog
        open={!!activeTemplate}
        onOpenChange={(o) => !o && setActiveTemplate(null)}
      >
        <DialogContent className="max-w-lg">
          {activeTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{activeTemplate.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <p>
                  <b>Байршил:</b> {activeTemplate.location}
                </p>
                <p>
                  <b>Төрөл:</b> {activeTemplate.category}
                </p>
                <p>
                  <b>Цалин:</b> {activeTemplate.salary.toLocaleString()} ₮
                </p>

                <div>
                  <b>Тайлбар:</b>
                  <p className="mt-1 whitespace-pre-line text-black/80">
                    {activeTemplate.description}
                  </p>
                </div>

                <p>
                  <b>Төрөл:</b> {activeTemplate.category || 'Тодорхойгүй'}
                </p>

                <p>
                  <b>Эхлэх:</b>{' '}
                  {new Date(activeTemplate.startTime).toLocaleString('mn-MN')}
                </p>
                <p>
                  <b>Дуусах:</b>{' '}
                  {new Date(activeTemplate.endTime).toLocaleString('mn-MN')}
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActiveTemplate(null)}
                >
                  Болих
                </Button>
                <Button onClick={() => applyTemplate(activeTemplate)}>
                  Загвар ашиглах
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

/* ---------- Helper ---------- */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
