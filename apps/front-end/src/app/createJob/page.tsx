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

/* ================= TYPES ================= */

type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  exp: number;
};

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

/* ================= HELPERS ================= */

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/* ================= PAGE ================= */

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  /* ---- form ---- */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [createTemplate, setCreateTemplate] = useState(false);

  /* ---- template ---- */
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(
    null,
  );

  /* ================= LOAD ================= */

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
      .catch(() => toast.error('Template ачаалж чадсангүй'));
  }, [router]);

  /* ================= APPLY TEMPLATE ================= */

  const applyTemplate = (job: JobTemplate) => {
    setTitle(job.title);
    setDescription(job.description);
    setLocation(job.location);
    setCategory(job.category);
    setSalary(job.salary);
    setStartTime(job.startTime);
    setEndTime(job.endTime);
    setCreateTemplate(false);
    setOpenDialog(false);
  };

  /* ================= DELETE TEMPLATE ================= */

  const deleteTemplate = async (jobId: number) => {
    if (!confirm('Энэ загварыг устгах уу?')) return;

    try {
      const res = await fetch(`${API_URL}/jobs/template/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error();

      toast.success('Template устгагдлаа');
      setTemplates((prev) => prev.filter((t) => t.jobId !== jobId));
      setSelectedTemplate(null);
    } catch {
      toast.error('Template устгах үед алдаа гарлаа');
    }
  };

  /* ================= SUBMIT ================= */

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
          isTemplate: createTemplate,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Амжилттай хадгалагдлаа');
      router.push('/');
    } catch {
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-screen-xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
          {/* ===== FORM ===== */}
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
                    <SelectItem value="Барилга">Барилга</SelectItem>
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createTemplate}
                  onChange={(e) => setCreateTemplate(e.target.checked)}
                />
                <Label>Энэ зараар template үүсгэх</Label>
              </div>

              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Хадгалж байна...' : 'Ажил нэмэх'}
              </Button>
            </CardContent>
          </Card>

          {/* ===== TEMPLATE BUTTON ===== */}
          <Button
            variant="outline"
            className="h-fit"
            onClick={() => setOpenDialog(true)}
          >
            Загвар харах
          </Button>
        </div>
      </main>

      {/* ===== TEMPLATE DIALOG ===== */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Өмнөх загварууд</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[280px_1fr] gap-6">
            {/* LEFT */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-3 border-r">
              {templates.map((t) => {
                const active = selectedTemplate?.jobId === t.jobId;

                return (
                  <div
                    key={t.jobId}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-3 rounded border cursor-pointer transition
                      ${
                        active
                          ? 'bg-blue-50 border-blue-400 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-sm font-medium line-clamp-1">
                      {t.title}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyTemplate(t);
                        }}
                      >
                        Ашиглах
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(t.jobId);
                        }}
                      >
                        Устгах
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT */}
            <div className="space-y-3 text-sm">
              {selectedTemplate ? (
                <>
                  <h4 className="font-semibold text-base">
                    {selectedTemplate.title}
                  </h4>
                  <p>
                    <b>Байршил:</b> {selectedTemplate.location}
                  </p>
                  <p>
                    <b>Төрөл:</b> {selectedTemplate.category}
                  </p>
                  <p>
                    <b>Цалин:</b> {selectedTemplate.salary.toLocaleString()} ₮
                  </p>
                  <p className="whitespace-pre-line text-black/80">
                    {selectedTemplate.description}
                  </p>
                </>
              ) : (
                <p className="text-black/50">Зүүн талаас загвар сонгоно уу</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

/* ================= FIELD ================= */

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
