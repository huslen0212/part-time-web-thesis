'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TimeInput } from '@mantine/dates';
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';

const API_URL = 'http://localhost:3001';

/* ================= TYPES ================= */
// backend-aas irj bui job object
interface ApiJob {
  jobId: number;
  title: string;
  description: string;
  location: string;
  category: string;
  salary: number;
  startTime: string;
  endTime: string;
  employer: { employerName: string | null };
}

// calendar deer haragdah event
interface EventBox {
  id: number;
  title: string;
  company: string;
  category: string;
  description: string;
  location: string;
  salary: number;
  startLabel: string;
  endLabel: string;
  dayIndex: number;
  top: number;
  bottom: number;
  overlapPercentage: number;
}

// Date → float tsag bolgoh (jishee 13:30 → 13.5)
function dateToFloat(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}

// "HH:mm" → float bolgoh
function hhmmToFloat(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}
// float → "HH:mm" bolgoh
function floatToHHMM(f: number): string {
  const h = Math.floor(f);
  const m = Math.round((f - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// user tsag + job tsagiin davhtsal bodoh
function calculateOverlap(js: number, je: number, us: number, ue: number) {
  const start = Math.max(js, us);
  const end = Math.min(je, ue);
  if (start >= end) return 0;
  const overlap = end - start;

  const jobPct = (overlap / (je - js)) * 100;
  const userPct = (overlap / (ue - us)) * 100;

  return (jobPct + userPct) / 2;
}

// davhtsaj bui event-uudiig group bolgono
function groupOverlappingEvents(events: EventBox[]) {
  const sorted = [...events].sort((a, b) => a.top - b.top);
  const groups: EventBox[][] = [];
  sorted.forEach((ev) => {
    let placed = false;
    for (const g of groups) {
      if (g.some((e) => ev.top < e.bottom && ev.bottom > e.top)) {
        g.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([ev]);
  });
  return groups;
}

/* ================= CONSTANTS ================= */

// JS getDay() → 0=Sun,1=Mon,...6=Sat  →  our index 0=Mon..6=Sun
const jsDayToIndex: Record<number, number> = {
  1: 0, // Даваа
  2: 1, // Мягмар
  3: 2, // Лхагва
  4: 3, // Пүрэв
  5: 4, // Баасан
  6: 5, // Бямба
  0: 6, // Ням
};

const dayList = [
  'Даваа',
  'Мягмар',
  'Лхагва',
  'Пүрэв',
  'Баасан',
  'Бямба',
  'Ням',
];

// ene doloo honogiin davaa oloh
function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jsDay = today.getDay();
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  return monday;
}

// songoson udriin bodit ognoo oloh
function getDateOfThisWeek(dayIndex: number): Date {
  const monday = getMondayOfCurrentWeek();
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIndex);
  return d;
}

const ROW_H = 48;

export default function CalendarPage() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [apiJobs, setApiJobs] = useState<ApiJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // user oruulsan tsag
  const [inputs, setInputs] = useState<
    { day: string; start: string; end: string; type: string }[]
  >(() => {
    if (typeof window === 'undefined')
      return [{ day: '', start: '', end: '', type: '' }];
    try {
      const saved = localStorage.getItem('calendar_inputs');
      return saved
        ? JSON.parse(saved)
        : [{ day: '', start: '', end: '', type: '' }];
    } catch {
      return [{ day: '', start: '', end: '', type: '' }];
    }
  });

  // oldson ajluud
  const [events, setEvents] = useState<EventBox[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('calendar_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /* Auth check */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setCheckedAuth(true);
  }, [router]);

  // inputs hadgalan
  useEffect(() => {
    localStorage.setItem('calendar_inputs', JSON.stringify(inputs));
  }, [inputs]);

  // events hadgalna
  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  }, [events]);

  // backend-aas job tatna
  useEffect(() => {
    if (!checkedAuth) return;
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: ApiJob[]) => {
        const jobs = Array.isArray(data) ? data : [];
        setApiJobs(jobs);
        const unique = Array.from(
          new Set(jobs.map((j) => j.category).filter(Boolean)),
        );
        setCategories(unique);
      })
      .catch(console.error)
      .finally(() => setJobsLoading(false));
  }, [checkedAuth]);

  if (!checkedAuth) return null;

  /* ================= HANDLERS ================= */

  const removeInputRow = (index: number) => {
    if (inputs.length <= 1) return;
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setEvents([]);
    setInputs([{ day: '', start: '', end: '', type: '' }]);
    localStorage.removeItem('calendar_events');
    localStorage.removeItem('calendar_inputs');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result: EventBox[] = [];

    inputs.forEach((input) => {
      if (!input.day || !input.start || !input.end) return;
      const us = hhmmToFloat(input.start);
      const ue = hhmmToFloat(input.end);
      if (us >= ue) return;

      const targetDayIndex = dayList.indexOf(input.day);

      apiJobs.forEach((job) => {
        const start = new Date(job.startTime);
        const end = new Date(job.endTime);

        const jobDayIndex = jsDayToIndex[start.getDay()];
        if (jobDayIndex !== targetDayIndex) return;

        // ene doloo honogiin ajil uu гэдгийг шалгана
        const targetDate = getDateOfThisWeek(targetDayIndex);
        if (start.toDateString() !== targetDate.toDateString()) return;

        // Category filter
        if (input.type && job.category !== input.type) return;

        const js = dateToFloat(start);
        const je = dateToFloat(end);

        const overlap = calculateOverlap(js, je, us, ue);
        // taarah huvi baga bvl hasna
        if (overlap < 10) return;

        result.push({
          id: job.jobId,
          title: job.title,
          company: job.employer.employerName || '—',
          category: job.category,
          description: job.description,
          location: job.location,
          salary: job.salary,
          startLabel: floatToHHMM(js),
          endLabel: floatToHHMM(je),
          dayIndex: jobDayIndex,
          top: js,
          bottom: je,
          overlapPercentage: overlap,
        });
      });
    });

    setEvents(result);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Хуваарь үүсгэх
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Өөрийн боломжит цагт таарах ажлуудыг хялбархан олоорой.
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Санамж: Зөвхөн энэ долоо хоногийн ажлуудыг харуулна. Та оруулсан
            цагийн мэдээллээ хадгалах боломжтой.
          </p>
        </div>

        {/* ── Form Card ── */}
        <Card className="shadow-none border-zinc-200 rounded-2xl bg-white">
          <CardHeader className="border-b border-zinc-100 pb-4 px-6 pt-5">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-800">
              <Clock className="w-4 h-4 text-[#2872A1]" />
              Чөлөөт цагаа оруулах
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-5 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inputs.map((row, idx) => (
                  <div
                    key={idx}
                    className="relative p-4 border border-zinc-100 rounded-xl bg-zinc-50 hover:border-zinc-200 transition-colors group"
                  >
                    {inputs.length > 1 && (
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex items-center justify-center"
                        onClick={() => removeInputRow(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <div className="space-y-3">
                      {/* Day */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal h-9 text-sm border-zinc-200 bg-white hover:border-[#2872A1]"
                          >
                            <span className="flex items-center gap-2 text-zinc-600">
                              <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                              {row.day || 'Өдөр сонгох'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px]">
                          {dayList.map((d) => (
                            <DropdownMenuItem
                              key={d}
                              onClick={() => {
                                const cp = [...inputs];
                                cp[idx].day = d;
                                setInputs(cp);
                              }}
                            >
                              {d}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Category */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal h-9 text-sm border-zinc-200 bg-white hover:border-[#2872A1]"
                          >
                            <span className="flex items-center gap-2 text-zinc-600">
                              <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                              {row.type || 'Бүх төрөл'}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px] max-h-[260px] overflow-y-auto">
                          <DropdownMenuItem
                            onClick={() => {
                              const cp = [...inputs];
                              cp[idx].type = '';
                              setInputs(cp);
                            }}
                          >
                            Бүх төрөл
                          </DropdownMenuItem>
                          {categories.map((c) => (
                            <DropdownMenuItem
                              key={c}
                              onClick={() => {
                                const cp = [...inputs];
                                cp[idx].type = c;
                                setInputs(cp);
                              }}
                            >
                              {c}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Times */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            Эхлэх цаг
                          </span>
                          <TimeInput
                            value={row.start}
                            onChange={(e) => {
                              const cp = [...inputs];
                              cp[idx].start = e.currentTarget.value;
                              setInputs(cp);
                            }}
                            classNames={{
                              input: 'rounded-xl border-zinc-200 text-sm h-9',
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] text-zinc-400 font-medium">
                            Дуусах цаг
                          </span>
                          <TimeInput
                            value={row.end}
                            onChange={(e) => {
                              const cp = [...inputs];
                              cp[idx].end = e.currentTarget.value;
                              setInputs(cp);
                            }}
                            classNames={{
                              input: 'rounded-xl border-zinc-200 text-sm h-9',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add row button */}
                <button
                  type="button"
                  disabled={inputs.length >= 7}
                  onClick={() =>
                    setInputs([
                      ...inputs,
                      { day: '', start: '', end: '', type: '' },
                    ])
                  }
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-200 rounded-xl hover:border-[#2872A1] hover:bg-blue-50/40 transition-all group disabled:opacity-40 disabled:cursor-not-allowed min-h-[140px]"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4 text-[#2872A1]" />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    Өдөр нэмэх
                  </span>
                </button>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={jobsLoading}
                  className="h-10 px-6 text-sm font-semibold bg-[#2872A1] hover:bg-[#1f5c82] text-white rounded-xl shadow-none"
                >
                  {jobsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ажлуудыг ачааллаж байна...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Тохирох ажлуудыг хайх
                    </>
                  )}
                </Button>
                {!jobsLoading && (
                  <span className="text-xs text-zinc-400">
                    {apiJobs.length} ажил ачааллагдлаа
                  </span>
                )}
                {events.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAll}
                    className="h-10 px-4 text-sm font-medium border-zinc-200 text-zinc-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-xl shadow-none ml-auto"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Цэвэрлэх
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Calendar Card ── */}
        <Card className="shadow-none border-zinc-200 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-zinc-100 px-6 py-4 flex flex-row justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CalendarIcon className="w-4 h-4 text-[#2872A1]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-800">
                  7 хоногийн хуваарь
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Таны төлөвлөсөн ажлууд
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-semibold border-0"
            >
              {events.length} ажил олдлоо
            </Badge>
          </CardHeader>

          <div className="overflow-x-auto">
            <div className="min-w-[900px] relative bg-white">
              {/* Day headers */}
              <div className="grid grid-cols-8 bg-zinc-50 border-b border-zinc-100 sticky top-0 z-10">
                <div className="py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">
                  Цаг
                </div>
                {dayList.map((d) => (
                  <div
                    key={d}
                    className="py-2.5 text-center text-xs font-bold text-zinc-600 border-r border-zinc-100 last:border-r-0 uppercase tracking-tight"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div className="relative">
                {Array.from({ length: 16 }).map((_, i) => {
                  const hour = i + 7;
                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-8 border-b border-zinc-100 last:border-b-0"
                      style={{ height: `${ROW_H}px` }}
                    >
                      {/* Hour label */}
                      <div className="text-[10px] font-semibold text-zinc-400 border-r border-zinc-100 bg-zinc-50/60 flex items-start justify-center pt-1.5">
                        {hour}:00
                      </div>

                      {/* Day cells */}
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayEvents = events.filter(
                          (e) => e.dayIndex === dayIdx,
                        );
                        const groups = groupOverlappingEvents(dayEvents);

                        return (
                          <div
                            key={dayIdx}
                            className="relative border-r border-zinc-100 last:border-r-0 bg-white"
                            style={{ height: `${ROW_H}px` }}
                          >
                            <div className="absolute top-1/2 w-full border-t border-dashed border-zinc-100 pointer-events-none" />

                            {groups.map((group) =>
                              group.map((ev, index) => {
                                if (ev.top >= hour + 1 || ev.bottom <= hour)
                                  return null;
                                const width = 100 / group.length;

                                return (
                                  <div
                                    key={ev.id}
                                    title={`${ev.title}\n${ev.company}\n${ev.location}\n${ev.salary.toLocaleString()}₮`}
                                    className={`
                                      absolute rounded-md border shadow-sm px-1.5 py-1
                                      flex flex-col justify-start cursor-pointer
                                      transition-all duration-200 overflow-hidden whitespace-nowrap
                                      bg-[#2872A1] border-[#1f5c82]
                                      text-white ring-1 ring-black/5
                                      hover:!w-[220px] hover:z-50 hover:shadow-lg
                                      hover:whitespace-normal hover:brightness-105
                                    `}
                                    style={{
                                      top: `${(ev.top - hour) * ROW_H + 2}px`,
                                      height: `${(ev.bottom - ev.top) * ROW_H - 4}px`,
                                      left: `${width * index + 0.5}%`,
                                      width: `${width - 1}%`,
                                    }}
                                    onClick={() =>
                                      router.push(`/jobs/${ev.id}`)
                                    }
                                  >
                                    <div className="font-semibold text-[10px] truncate leading-tight">
                                      {ev.title}
                                    </div>
                                    <div className="text-[9px] opacity-80 truncate flex items-center gap-0.5 mt-0.5">
                                      <Briefcase className="w-2.5 h-2.5 shrink-0" />
                                      {ev.company}
                                    </div>
                                    <div className="text-[9px] opacity-80 mt-0.5 line-clamp-3 whitespace-normal leading-tight">
                                      {ev.description}
                                    </div>
                                    <div className="mt-auto text-[8px] font-medium opacity-90 bg-black/20 rounded px-1 py-0.5 w-fit">
                                      {ev.startLabel}–{ev.endLabel}
                                    </div>
                                  </div>
                                );
                              }),
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
