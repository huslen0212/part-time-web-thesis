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
import CreatableSelect from 'react-select/creatable';
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
  Star,
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
  category: { categoryId: number; name: string };
  salary: number;
  startTime: string;
  endTime: string;
  numberOfWorker: number;
};

type AvailabilitySlot = {
  day: number;
  startTime: string;
  endTime: string;
};

type SeekerResult = {
  jobseekerId: number;
  userName: string;
  skills: string | null;
  interestedCategory: string | null;
  avgRating: number | null;
  ratingCount: number;
  availabilities: AvailabilitySlot[];
};

type CategoryOption = { value: string; label: string };

type PastWorker = {
  jobseekerId: number;
  userName: string | null;
  phoneNumber: string | null;
  skills: string | null;
  interestedCategory: string | null;
  avgRating: number | null;
  ratingCount: number;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

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
        <div className="w-8 h-8 rounded-lg bg-[#2872a1] text-white flex items-center justify-center shrink-0">
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

const DAY_NAMES = ['Ня', 'Да', 'Мя', 'Лха', 'Пү', 'Ба', 'Бя'];

function fmtTime(dt: string) {
  const d = new Date(dt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={
            i <= Math.round(score)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-zinc-200 text-zinc-200'
          }
        />
      ))}
    </div>
  );
}

export default function CreateJobPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<CategoryOption | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
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

  const [createdJobId, setCreatedJobId] = useState<number | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'matching' | 'past'>('matching');
  const [seekers, setSeekers] = useState<SeekerResult[]>([]);
  const [seekerLoading, setSeekerLoading] = useState(false);
  const [filterAvailability, setFilterAvailability] = useState(true);
  const [filterCategory, setFilterCategory] = useState(false);
  const [pastWorkers, setPastWorkers] = useState<PastWorker[]>([]);
  const [pastWorkersLoading, setPastWorkersLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
  const [invitingId, setInvitingId] = useState<number | null>(null);

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

    fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((data) =>
        setCategoryOptions(
          data.map((c: { categoryId: number; name: string }) => ({
            value: c.name,
            label: c.name,
          })),
        ),
      )
      .catch(console.error);
  }, [router]);

  useEffect(() => {
    if (!matchModalOpen || !createdJobId) return;
    const fetchSeekers = async () => {
      setSeekerLoading(true);
      try {
        const params = new URLSearchParams({
          filterAvailability: String(filterAvailability),
          filterCategory: String(filterCategory),
        });
        const res = await fetch(
          `${API_URL}/jobs/${createdJobId}/seekers?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          },
        );
        setSeekers(await res.json());
      } catch {
        toast.error('Ажил хайгчдыг ачаалж чадсангүй');
      } finally {
        setSeekerLoading(false);
      }
    };
    fetchSeekers();
  }, [matchModalOpen, createdJobId, filterAvailability, filterCategory]);

  useEffect(() => {
    if (!matchModalOpen) return;
    const fetchPastWorkers = async () => {
      setPastWorkersLoading(true);
      try {
        const res = await fetch(`${API_URL}/jobs/my-past-workers`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPastWorkers(await res.json());
      } catch {
        toast.error('Өмнөх ажилчдыг ачаалж чадсангүй');
      } finally {
        setPastWorkersLoading(false);
      }
    };
    fetchPastWorkers();
  }, [matchModalOpen]);

  const applyTemplate = (job: JobTemplate) => {
    setTitle(job.title);
    setDescription(job.description);
    setLocation(job.location);
    setCategory({ value: job.category.name, label: job.category.name });
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
      !category?.value ||
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
          category: category?.value,
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
      const data = await res.json();
      toast.success('Амжилттай хадгалагдлаа');
      setCreatedJobId(data.job.jobId);
      setMatchModalOpen(true);
    } catch {
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const closeMatchModal = () => {
    setMatchModalOpen(false);
    sessionStorage.setItem('job_created', '1');
    router.push('/');
  };

  const handleInvite = async (seekerId: number) => {
    if (!createdJobId) return;
    setInvitingId(seekerId);
    try {
      const res = await fetch(
        `${API_URL}/jobs/${createdJobId}/invite/${seekerId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );
      if (res.status === 409) {
        toast.info('Ажлын санал аль хэдийн илгээгдсэн байна');
        setInvitedIds((prev) => new Set(prev).add(seekerId));
        return;
      }
      if (!res.ok) throw new Error();
      toast.success('Ажлын санал илгээгдлээ');
      setInvitedIds((prev) => new Set(prev).add(seekerId));
    } catch {
      toast.error('Ажлын санал илгээхэд алдаа гарлаа');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
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
            className="gap-2 border-[#2872a1] text-[#2872a1] hover:bg-[#2872a1] hover:text-white rounded-xl"
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
                    className="rounded-xl border-zinc-200 focus-visible:ring-[#7f9db1]"
                  />
                </FieldGroup>
                <FieldGroup label="Тайлбар">
                  <Textarea
                    rows={4}
                    placeholder="Ажлын дэлгэрэнгүй тайлбар..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border-zinc-200 focus-visible:ring-[#7f9db1] resize-none"
                  />
                </FieldGroup>
                <FieldGroup label="Төрөл">
                  <CreatableSelect
                    isClearable
                    options={categoryOptions}
                    value={category}
                    onChange={setCategory}
                    placeholder="Ажлын төрөл сонгох эсвэл шинээр нэмэх..."
                    formatCreateLabel={(input) => `"${input}" нэмэх`}
                    menuPortalTarget={
                      typeof document !== 'undefined' ? document.body : null
                    }
                    menuPosition="fixed"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderRadius: '0.75rem',
                        borderColor: state.isFocused ? '#7f9db1' : '#e4e4e7',
                        boxShadow: state.isFocused
                          ? '0 0 0 1px #7f9db1'
                          : 'none',
                        '&:hover': { borderColor: '#7f9db1' },
                        fontSize: '0.875rem',
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? '#2872a1'
                          : state.isFocused
                            ? '#dbeafe'
                            : 'white',
                        color: state.isSelected ? 'white' : '#18181b',
                        fontSize: '0.875rem',
                      }),
                    }}
                  />
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
                    className="rounded-xl border-zinc-200 focus-visible:ring-[#7f9db1]"
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

            <SectionCard
              icon={<Clock size={15} />}
              title="Ажил эхлэх дуусах огноо"
            >
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
                    className="rounded-xl border-zinc-200 focus-visible:ring-[#7f9db1]"
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
              className="w-full rounded-xl bg-[#2872a1] hover:bg-[#7f9db1] text-white font-semibold gap-2 h-12"
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
        <DialogContent className="max-w-3xl rounded-2xl bg-white border border-[#CBDDE9]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              Өмнөх загварууд
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-[240px_1fr] gap-5 mt-1">
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-black gap-2">
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
                        ? 'bg-[#CBDDE9] border-[#CBDDE9] ring-2 ring-[#CBDDE9]/20'
                        : 'bg-white border-[#CBDDE9] hover:border-[#2872A1] hover:bg-[#CBDDE9]/40',
                    )}
                  >
                    <p className="text-sm font-semibold truncate mb-0.5 text-black">
                      {t.title}
                    </p>
                    <p className="text-xs mb-3 text-black">
                      {t.category.name} · {t.salary.toLocaleString()}₮
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs rounded-lg bg-[#2872A1] hover:bg-[#1f5c82] text-white"
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
                        className="h-7 w-7 p-0 rounded-lg border-[#CBDDE9] text-[#2872A1] hover:bg-[#CBDDE9]"
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

            <div className="bg-white rounded-xl border border-[#CBDDE9] p-5 min-h-[200px]">
              {selectedTemplate ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">
                      {selectedTemplate.title}
                    </h4>
                    <Badge className="bg-[#2872A1] text-white hover:bg-[#1f5c82] font-medium">
                      {selectedTemplate.category.name}
                    </Badge>
                  </div>
                  <Separator className="bg-[#CBDDE9]" />
                  <div className="flex flex-col gap-2.5 text-sm">
                    <div className="flex gap-3">
                      <span className="font-semibold text-black w-20 shrink-0">
                        Байршил
                      </span>
                      <span className="text-black">
                        {selectedTemplate.location}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-black w-20 shrink-0">
                        Цалин
                      </span>
                      <span className="text-black">
                        {selectedTemplate.salary.toLocaleString()} ₮
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-semibold text-black w-20 shrink-0">
                        Авах хүн
                      </span>
                      <span className="text-black">
                        {selectedTemplate.numberOfWorker} хүн
                      </span>
                    </div>
                  </div>
                  <Separator className="bg-[#CBDDE9]" />
                  <p className="text-sm text-black leading-relaxed whitespace-pre-line">
                    {selectedTemplate.description}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-black gap-2">
                  <LayoutTemplate size={30} />
                  <p className="text-xs">Зүүн талаас загвар сонгоно уу</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl border-[#CBDDE9] text-black hover:bg-[#CBDDE9]"
              onClick={() => setOpenDialog(false)}
            >
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MATCHING SEEKERS MODAL */}
      <Dialog
        open={matchModalOpen}
        onOpenChange={(v) => !v && closeMatchModal()}
      >
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900">
              Ажил хайгчид
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
            <button
              onClick={() => setModalTab('matching')}
              className={cn(
                'flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors',
                modalTab === 'matching'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700',
              )}
            >
              Тохирох ажил хайгчид
            </button>
            <button
              onClick={() => setModalTab('past')}
              className={cn(
                'flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors',
                modalTab === 'past'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700',
              )}
            >
              Миний ажил хийлгэсэн ажилчид
            </button>
          </div>

          {/* ── Tab: Тохирох ажил хайгчид ── */}
          {modalTab === 'matching' && (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setFilterAvailability((v) => !v)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors select-none',
                    filterAvailability
                      ? 'bg-[#2872a1] border-[#2872a1] text-white'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300',
                  )}
                >
                  <Clock size={14} />
                  Цагийн хуваарь
                </button>
                <button
                  onClick={() => setFilterCategory((v) => !v)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors select-none',
                    filterCategory
                      ? 'bg-[#2872a1] border-[#2872a1] text-white'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300',
                  )}
                >
                  <Briefcase size={14} />
                  Ажлын төрөл
                </button>
                <span className="ml-auto text-xs text-zinc-400">
                  {seekerLoading ? (
                    <Loader2 size={13} className="animate-spin inline" />
                  ) : (
                    `${seekers.length} хүн олдлоо`
                  )}
                </span>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                {seekerLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-zinc-300" size={28} />
                  </div>
                ) : seekers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                    <Briefcase size={30} />
                    <p className="text-sm">Тохирох ажил хайгч олдсонгүй</p>
                  </div>
                ) : (
                  seekers.map((s) => (
                    <div
                      key={s.jobseekerId}
                      className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#CBDDE9] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-semibold text-zinc-900">
                            {s.userName}
                          </p>
                          {s.interestedCategory && (
                            <Badge className="w-fit bg-[#2872a1] text-white text-xs font-medium hover:bg-[#1f5c82]">
                              {s.interestedCategory}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {s.avgRating !== null ? (
                            <>
                              <StarRating score={s.avgRating} />
                              <span className="text-xs text-zinc-500">
                                {s.avgRating} ({s.ratingCount} үнэлгээ)
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              Үнэлгээ байхгүй
                            </span>
                          )}
                        </div>
                      </div>
                      {s.skills && (
                        <>
                          <Separator />
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {s.skills}
                          </p>
                        </>
                      )}
                      {s.availabilities.length > 0 && (
                        <>
                          <Separator />
                          <div className="flex flex-wrap gap-1.5">
                            {s.availabilities.map((a, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-medium"
                              >
                                <Clock size={10} />
                                {DAY_NAMES[a.day]} {fmtTime(a.startTime)}–
                                {fmtTime(a.endTime)}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      <Button
                        size="sm"
                        disabled={
                          invitedIds.has(s.jobseekerId) ||
                          invitingId === s.jobseekerId
                        }
                        onClick={() => handleInvite(s.jobseekerId)}
                        className={cn(
                          'w-full h-8 text-xs rounded-xl font-medium transition-colors',
                          invitedIds.has(s.jobseekerId)
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'bg-[#2872a1] hover:bg-[#1f5c82] text-white',
                        )}
                      >
                        {invitingId === s.jobseekerId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : invitedIds.has(s.jobseekerId) ? (
                          '✓ Ажлын санал илгээгдлээ'
                        ) : (
                          'Санал илгээх'
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ── Tab: Миний ажил хийлгэсэн ажилчид ── */}
          {modalTab === 'past' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                  Өмнөх ажлуудад зөвшөөрөгдсөн ажилчид
                </p>
                <span className="text-xs text-zinc-400">
                  {pastWorkersLoading ? (
                    <Loader2 size={13} className="animate-spin inline" />
                  ) : (
                    `${pastWorkers.length} хүн`
                  )}
                </span>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                {pastWorkersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-zinc-300" size={28} />
                  </div>
                ) : pastWorkers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                    <Briefcase size={30} />
                    <p className="text-sm">Өмнөх ажилчид байхгүй байна</p>
                  </div>
                ) : (
                  pastWorkers.map((s) => (
                    <div
                      key={s.jobseekerId}
                      className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-200 bg-white hover:border-[#CBDDE9] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-semibold text-zinc-900">
                            {s.userName || 'Нэргүй'}
                          </p>
                          {s.interestedCategory && (
                            <Badge className="w-fit bg-[#2872a1] text-white text-xs font-medium hover:bg-[#1f5c82]">
                              {s.interestedCategory}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {s.avgRating !== null ? (
                            <>
                              <StarRating score={s.avgRating} />
                              <span className="text-xs text-zinc-500">
                                {s.avgRating} ({s.ratingCount} үнэлгээ)
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              Үнэлгээ байхгүй
                            </span>
                          )}
                        </div>
                      </div>
                      {s.skills && (
                        <>
                          <Separator />
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {s.skills}
                          </p>
                        </>
                      )}
                      <Button
                        size="sm"
                        disabled={
                          invitedIds.has(s.jobseekerId) ||
                          invitingId === s.jobseekerId
                        }
                        onClick={() => handleInvite(s.jobseekerId)}
                        className={cn(
                          'w-full h-8 text-xs rounded-xl font-medium transition-colors',
                          invitedIds.has(s.jobseekerId)
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'bg-[#2872a1] hover:bg-[#1f5c82] text-white',
                        )}
                      >
                        {invitingId === s.jobseekerId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : invitedIds.has(s.jobseekerId) ? (
                          '✓ Ажлын санал илгээгдлээ'
                        ) : (
                          'Санал илгээх'
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={closeMatchModal}
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
