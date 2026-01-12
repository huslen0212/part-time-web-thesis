'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sampleJobs, jobCategory } from '@/app/data/jobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TimePicker } from '@/components/time-picker';
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Search,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react';

/* ================= TYPES ================= */

interface Job {
  id: number;
  title: string;
  day: string;
  start: string;
  end: string;
  company: string;
  category: string;
  description?: string;
}

interface EventBox extends Job {
  dayIndex: number;
  top: number;
  bottom: number;
  overlapPercentage: number;
  fitScore: number;
}

/* ================= HELPERS ================= */

function hhmmToFloat(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function calculateOverlap(js: number, je: number, us: number, ue: number) {
  const start = Math.max(js, us);
  const end = Math.min(je, ue);
  if (start >= end) return 0;

  const overlap = end - start;
  return ((overlap / (je - js)) * 100 + (overlap / (ue - us)) * 100) / 2;
}

function calculateFitScore(js: number, je: number, us: number, ue: number) {
  let score = (calculateOverlap(js, je, us, ue) / 100) * 40;

  if (js >= us && je <= ue) score += 20;
  if (Math.abs(js - us) < 0.5) score += 10;
  if (Math.abs(je - ue) < 0.5) score += 10;

  const diff = Math.abs(je - js - (ue - us));
  score += Math.max(0, 20 - diff * 5);

  return Math.round(score);
}

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

const dayIndex: Record<string, number> = {
  Даваа: 0,
  Мягмар: 1,
  Лхагва: 2,
  Пүрэв: 3,
  Баасан: 4,
  Бямба: 5,
  Ням: 6,
};

const dayList = Object.keys(dayIndex);

const categoryColors: Record<string, string> = {
  Худалдаа: 'bg-blue-500 border-blue-600',
  Хоол: 'bg-orange-500 border-orange-600',
  Цэвэрлэгээ: 'bg-emerald-500 border-emerald-600',
  Хүргэлт: 'bg-purple-500 border-purple-600',
  Агуулах: 'bg-slate-600 border-slate-700',
  Үйлчилгээ: 'bg-pink-500 border-pink-600',
  Маркетинг: 'bg-yellow-500 border-yellow-600',
  Дэмжлэг: 'bg-cyan-500 border-cyan-600',
  Ивент: 'bg-rose-500 border-rose-600',
};

/* ================= COMPONENT ================= */

export default function CalendarPage() {
  const router = useRouter();

  /* ✅ БҮХ useState — ЭХЭНД */
  const [checkedAuth, setCheckedAuth] = useState(false);

  const [inputs, setInputs] = useState<
    { day: string; start: string; end: string; type: string }[]
  >([{ day: '', start: '', end: '', type: '' }]);

  const [events, setEvents] = useState<EventBox[]>([]);

  /* ✅ Auth guard */
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    setCheckedAuth(true);
  }, [router]);

  /* ✅ Conditional return ХАМГИЙН СҮҮЛД */
  if (!checkedAuth) return null;

  /* ================= HANDLERS ================= */

  const removeInputRow = (index: number) => {
    if (inputs.length <= 1) return;
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result: EventBox[] = [];

    inputs.forEach((input) => {
      if (!input.day || !input.start || !input.end) return;

      const us = parseFloat(input.start);
      const ue = parseFloat(input.end);
      if (us >= ue) return;

      sampleJobs.forEach((job) => {
        if (job.day !== input.day) return;
        if (input.type && job.category !== input.type) return;

        const js = hhmmToFloat(job.start);
        const je = hhmmToFloat(job.end);

        const overlap = calculateOverlap(js, je, us, ue);
        if (overlap < 10) return;

        result.push({
          ...job,
          dayIndex: dayIndex[job.day],
          top: js,
          bottom: je,
          overlapPercentage: overlap,
          fitScore: calculateFitScore(js, je, us, ue),
        });
      });
    });

    setEvents(result);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900">
      <main className="max-w-7xl mx-auto space-y-8">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Ажлын хуваарь зохицуулагч
            </h1>
            <p className="text-gray-500 mt-1">
              Өөрийн боломжит цагт таарах ажлуудыг хялбархан олоорой.
            </p>
          </div>
        </div>

        {/* ================= FORM SECTION ================= */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <Clock className="w-5 h-5" />
              Чөлөөт цагаа оруулах
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {inputs.map((row, idx) => (
                  <div
                    key={idx}
                    className="relative p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {inputs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        onClick={() => removeInputRow(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    <div className="space-y-4">
                      {/* Day Selection */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal hover:border-blue-400"
                          >
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              {row.day || 'Өдөр сонгох'}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
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

                      {/* Category Selection */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal hover:border-blue-400"
                          >
                            <span className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              {row.type || 'Бүх төрөл'}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px] max-h-[300px] overflow-y-auto">
                          <DropdownMenuItem
                            onClick={() => {
                              const cp = [...inputs];
                              cp[idx].type = '';
                              setInputs(cp);
                            }}
                          >
                            Бүх төрөл
                          </DropdownMenuItem>
                          {jobCategory.map((c) => (
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

                      {/* Time Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500">
                            Эхлэх цаг
                          </span>
                          <TimePicker
                            value={row.start}
                            onChange={(val) => {
                              const cp = [...inputs];
                              cp[idx].start = val;
                              setInputs(cp);
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs text-gray-500">
                            Дуусах цаг
                          </span>
                          <TimePicker
                            value={row.end}
                            onChange={(val) => {
                              const cp = [...inputs];
                              cp[idx].end = val;
                              setInputs(cp);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Button Box */}
                <button
                  type="button"
                  disabled={inputs.length >= 7}
                  onClick={() =>
                    setInputs([
                      ...inputs,
                      { day: '', start: '', end: '', type: '' },
                    ])
                  }
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Өдөр нэмэх
                  </span>
                </button>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full md:w-auto px-8 py-6 text-base font-semibold bg-gray-900 hover:bg-gray-800 shadow-xl shadow-gray-200"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Тохирох ажлуудыг хайх
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ================= CALENDAR SECTION ================= */}
        <Card className="border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden bg-white ring-1 ring-slate-900/5">
          <CardHeader className="bg-white border-b border-slate-100 px-8 py-6 flex flex-row justify-between items-center backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  7 хоногийн хуваарь
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Таны төлөвлөсөн ажлууд
                </p>
              </div>
            </div>

            <Badge
              variant="secondary"
              className="px-4 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors rounded-full font-semibold border-0"
            >
              {events.length} ажил олдлоо
            </Badge>
          </CardHeader>

          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1000px] relative bg-white">
              <div className="grid grid-cols-8 bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md">
                <div className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center border-r border-slate-200/60">
                  Цаг
                </div>
                {dayList.map((d) => (
                  <div
                    key={d}
                    className="p-4 text-center text-sm font-bold text-slate-700 border-r border-slate-200/60 last:border-r-0 uppercase tracking-tight"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Table Body */}
              <div className="relative">
                {Array.from({ length: 16 }).map((_, i) => {
                  const hour = i + 7;
                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-8 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 transition-colors group/row"
                    >
                      {/* Time Column - Distinct Look */}
                      <div className="p-2 text-xs font-semibold text-slate-400 border-r border-slate-200/60 bg-slate-50/40 flex items-start justify-center pt-3 group-hover/row:bg-slate-100/50 transition-colors">
                        {hour}:00
                      </div>

                      {/* Days Columns */}
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayEvents = events.filter(
                          (e) => e.dayIndex === dayIdx,
                        );
                        const groups = groupOverlappingEvents(dayEvents);

                        return (
                          <div
                            key={dayIdx}
                            className="relative min-h-[70px] border-r border-slate-200/60 last:border-r-0 group/cell bg-white"
                          >
                            {/* Grid lines helper - Softer look */}
                            <div className="absolute top-1/2 w-full border-t border-dashed border-slate-100 -z-0 pointer-events-none"></div>

                            {groups.map((group) =>
                              group.map((ev, index) => {
                                if (ev.top >= hour + 1 || ev.bottom <= hour)
                                  return null;

                                const width = 100 / group.length;

                                return (
                                  <div
                                    key={ev.id}
                                    className={`
                                  absolute rounded-lg border shadow-sm p-2.5
                                  flex flex-col justify-start cursor-pointer group
                                  transition-all duration-300 ease-out
                                  overflow-hidden whitespace-nowrap
                                  
                                  /* Colors - Таны логик хэвээрээ */
                                  ${
                                    categoryColors[ev.category] ||
                                    'bg-blue-600 border-blue-700'
                                  }
                                  text-white ring-1 ring-black/5

                                  /* Hover Logic: Таны хүссэнээр яг хэвээрээ */
                                  hover:!w-[260px] 
                                  hover:z-50 
                                  hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]
                                  hover:brightness-105
                                  hover:whitespace-normal
                                  hover:scale-[1.02]
                                `}
                                    title={ev.description}
                                    aria-label={ev.description}
                                    style={{
                                      top: `${(ev.top - hour) * 70 + 3}px`,
                                      height: `${(ev.bottom - ev.top) * 70 - 6}px`, // Slight padding adjustment
                                      left: `${width * index + 0.5}%`, // Slight offset
                                      width: `${width - 1}%`,
                                    }}
                                  >
                                    <div className="font-bold text-xs truncate hover:text-clip leading-tight mb-1 tracking-wide">
                                      {ev.title}
                                    </div>
                                    <div className="text-[10px] opacity-90 truncate mb-1.5 flex items-center gap-1">
                                      <Briefcase className="w-3 h-3 inline opacity-80" />
                                      <span className="font-medium">
                                        {ev.company}
                                      </span>
                                    </div>

                                    {ev.description && (
                                      <div className="text-[11px] opacity-95 leading-snug mb-2 text-white/90 line-clamp-2">
                                        {ev.description}
                                      </div>
                                    )}

                                    <div className="mt-auto text-[9px] font-medium tracking-wider opacity-90 bg-black/20 rounded-md px-1.5 py-0.5 w-fit backdrop-blur-sm">
                                      {ev.start} - {ev.end}
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
    </div>
  );
}
