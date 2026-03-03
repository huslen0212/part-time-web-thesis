'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import GoogleMapComponent from '@/components/GoogleMap';
import { DateTimePicker } from '@mantine/dates';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  LayoutTemplate,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

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
  numberOfWorker: number;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const CATEGORIES = [
  'Үйлчилгээ',
  'Маркетинг',
  'IT',
  'Оффис',
  'Хүргэлт',
  'Барилга',
];

function SectionCard({
  icon,
  title,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'border-zinc-200 shadow-none rounded-2xl overflow-hidden',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center gap-3 px-6 py-4 bg-zinc-50 border-b border-zinc-100 space-y-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <CardTitle className="text-xs font-semibold text-zinc-400 tracking-widest uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-5">{children}</CardContent>
    </Card>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-zinc-600">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [createTemplate, setCreateTemplate] = useState(false);
  const [numberOfWorker, setNumberOfWorker] = useState<number | ''>('');

  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(
    null,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

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

  const applyTemplate = (job: JobTemplate) => {
    setTitle(job.title);
    setDescription(job.description);
    setLocation(job.location);
    setCategory(job.category);
    setSalary(job.salary);
    setStartTime(job.startTime ? new Date(job.startTime) : null);
    setEndTime(job.endTime ? new Date(job.endTime) : null);
    setCreateTemplate(false);
    setOpenDialog(false);
    setNumberOfWorker(job.numberOfWorker ?? 1);
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocation(address);
  };

  const handleStartTimeChange = (value: string | null) => {
    setStartTime(value ? new Date(value) : null);
  };

  const handleEndTimeChange = (value: string | null) => {
    setEndTime(value ? new Date(value) : null);
  };

  const openDeleteConfirm = (jobId: number) => {
    setDeleteTargetId(jobId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`${API_URL}/jobs/template/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Template устгагдлаа');
      setTemplates((prev) => prev.filter((t) => t.jobId !== deleteTargetId));
      setSelectedTemplate(null);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    } catch {
      toast.error('Template устгах үед алдаа гарлаа');
    }
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !location ||
      !category ||
      salary === '' ||
      numberOfWorker === '' ||
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
          latitude,
          longitude,
          numberOfWorker: Number(numberOfWorker),
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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              Шинэ ажил нэмэх
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Мэдээллийг бөглөж ажлын зарыг нийтлэнэ үү
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl"
            onClick={() => setOpenDialog(true)}
          >
            <LayoutTemplate size={15} />
            Загвар ашиглах
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* LEFT */}
          <div className="flex flex-col gap-5">
            <SectionCard icon={<Briefcase size={15} />} title="Үндсэн мэдээлэл">
              <div className="flex flex-col gap-4">
                <FieldGroup label="Ажлын гарчиг">
                  <Input
                    placeholder="Жишээ: Барилгын ажилчин"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </FieldGroup>
                <FieldGroup label="Тайлбар">
                  <Textarea
                    rows={4}
                    placeholder="Ажлын дэлгэрэнгүй тайлбар..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border-zinc-200 focus-visible:ring-emerald-500 resize-none"
                  />
                </FieldGroup>
                <FieldGroup label="Төрөл">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl border-zinc-200 focus:ring-emerald-500">
                      <SelectValue placeholder="Ажлын төрөл сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
            </SectionCard>

            <SectionCard icon={<MapPin size={15} />} title="Байршил">
              <div className="flex flex-col gap-4">
                <FieldGroup label="Хаяг">
                  <Input
                    placeholder="Хаяг оруулах..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="rounded-xl border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </FieldGroup>
                <FieldGroup label="Газрын зураг дээр сонгох">
                  <div className="rounded-xl overflow-hidden border border-zinc-200">
                    <GoogleMapComponent
                      onSelectLocation={handleLocationSelect}
                    />
                  </div>
                </FieldGroup>
              </div>
            </SectionCard>

            <SectionCard icon={<Clock size={15} />} title="Цаг хугацаа">
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Эхлэх цаг">
                  <DateTimePicker
                    value={startTime}
                    onChange={handleStartTimeChange}
                    valueFormat="YYYY-MM-DD HH:mm"
                    clearable
                    placeholder="Огноо сонгох"
                    classNames={{ input: 'rounded-xl border-zinc-200 text-sm' }}
                  />
                </FieldGroup>
                <FieldGroup label="Дуусах цаг">
                  <DateTimePicker
                    value={endTime}
                    onChange={handleEndTimeChange}
                    valueFormat="YYYY-MM-DD HH:mm"
                    clearable
                    placeholder="Огноо сонгох"
                    classNames={{ input: 'rounded-xl border-zinc-200 text-sm' }}
                  />
                </FieldGroup>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-5">
            <SectionCard icon={<DollarSign size={15} />} title="Нөхцөл">
              <div className="flex flex-col gap-4">
                <FieldGroup label="Цалин (₮)">
                  <Input
                    type="number"
                    placeholder="0"
                    value={salary}
                    onChange={(e) =>
                      setSalary(e.target.value ? Number(e.target.value) : '')
                    }
                    className="rounded-xl border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </FieldGroup>
                <FieldGroup label="Авах ажилчдын тоо">
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    value={numberOfWorker}
                    onChange={(e) =>
                      setNumberOfWorker(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    className="rounded-xl border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </FieldGroup>
              </div>
            </SectionCard>

            <SectionCard icon={<FileText size={15} />} title="Загвар">
              <div
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors select-none',
                  createTemplate
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300',
                )}
                onClick={() => setCreateTemplate(!createTemplate)}
              >
                <Checkbox
                  checked={createTemplate}
                  onCheckedChange={(v) => setCreateTemplate(Boolean(v))}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    Загвар болгон хадгалах
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Дараагийн удаа дахин ашиглах боломжтой
                  </p>
                </div>
              </div>
            </SectionCard>

            <Button
              size="lg"
              className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold gap-2 h-12"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Хадгалж
                  байна...
                </>
              ) : (
                <>
                  <Plus size={18} /> Ажил нэмэх
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* DELETE CONFIRM */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Загварыг устгах уу?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500 leading-relaxed">
            <span className="font-semibold text-zinc-800">
              "{templates.find((t) => t.jobId === deleteTargetId)?.title}"
            </span>{' '}
            загварыг устгахад итгэлтэй байна уу? Энэ үйлдэл буцаах боломжгүй.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTargetId(null);
              }}
            >
              Болих
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={confirmDelete}
            >
              Устгах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TEMPLATE DIALOG */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Өмнөх загварууд
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[240px_1fr] gap-5 mt-1">
            {/* List */}
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-300 gap-2">
                  <LayoutTemplate size={28} />
                  <p className="text-xs">Хадгалсан загвар байхгүй</p>
                </div>
              )}
              {templates.map((t) => {
                const active = selectedTemplate?.jobId === t.jobId;
                return (
                  <div
                    key={t.jobId}
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      'p-3 rounded-xl border cursor-pointer transition-all',
                      active
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                    )}
                  >
                    <p className="text-sm font-semibold text-zinc-800 truncate mb-0.5">
                      {t.title}
                    </p>
                    <p className="text-xs text-zinc-400 mb-3">
                      {t.category} · {t.salary.toLocaleString()}₮
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs rounded-lg bg-emerald-700 hover:bg-emerald-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyTemplate(t);
                        }}
                      >
                        Ашиглах
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm(t.jobId);
                        }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail */}
            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 min-h-[200px]">
              {selectedTemplate ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-zinc-900 mb-2">
                      {selectedTemplate.title}
                    </h4>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-medium">
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2.5 text-sm">
                    <div className="flex gap-3">
                      <span className="font-semibold text-zinc-600 w-20 shrink-0">
                        Байршил
                      </span>
                      <span className="text-zinc-500">
                        {selectedTemplate.location}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-zinc-600 w-20 shrink-0">
                        Цалин
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        {selectedTemplate.salary.toLocaleString()} ₮
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-zinc-600 w-20 shrink-0">
                        Авах хүн
                      </span>
                      <span className="text-zinc-500">
                        {selectedTemplate.numberOfWorker} хүн
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
                    {selectedTemplate.description}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-zinc-300 gap-2">
                  <LayoutTemplate size={30} />
                  <p className="text-xs">Зүүн талаас загвар сонгоно уу</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpenDialog(false)}
            >
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
