'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Calendar,
  MapPin,
  Users,
  Search,
  SlidersHorizontal,
  Banknote,
} from 'lucide-react';
import NearbySearchMap from '@/components/NearbySearchMap';
import { cn } from '@/lib/utils';

const API_URL = 'http://localhost:3001';

type Job = {
  jobId: number;
  title: string;
  description: string;
  category: { categoryId: number; name: string };
  location: string;
  salary: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  numberOfWorker: number;
  employer?: { employerName?: string | null };
};

type SearchType = 'title' | 'category' | 'salary' | 'location';

const SEARCH_TABS: {
  type: SearchType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: 'title', label: 'Нэрээр', icon: <Search size={14} /> },
  { type: 'category', label: 'Төрлөөр', icon: <SlidersHorizontal size={14} /> },
  { type: 'salary', label: 'Цалингаар', icon: <Banknote size={14} /> },
  { type: 'location', label: 'Байршлаар', icon: <MapPin size={14} /> },
];

const RADIUS_OPTIONS = [300, 500, 1000, 2000];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formattedDate} ${formattedTime}`;
}

export default function JobSeekerHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchType, setSearchType] = useState<SearchType>('title');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [radius, setRadius] = useState(500);

  useEffect(() => {
    fetch(`${API_URL}/jobs`)
      .then((r) => r.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setError('Сервертэй холбогдож чадсангүй'))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data.map((c: { name: string }) => c.name)))
      .catch(console.error);
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (searchType === 'title' && searchValue.trim())
      return job.title.toLowerCase().includes(searchValue.toLowerCase());
    if (searchType === 'category')
      return (
        selectedCategory === 'all' || job.category.name === selectedCategory
      );
    if (searchType === 'salary' && searchValue)
      return job.salary >= Number(searchValue.replace(/\D/g, ''));
    return true;
  });

  const finalJobs =
    searchType === 'location'
      ? Array.isArray(nearbyJobs)
        ? nearbyJobs
        : []
      : filteredJobs;

  const handleTabChange = (type: SearchType) => {
    setSearchType(type);
    setSearchValue('');
    setSelectedCategory('all');
    setNearbyJobs([]);
  };

  const handleRadiusChange = (r: number) => {
    setRadius(r);
    setNearbyJobs([]);
  };

  return (
    <section className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* ── Hero ── */}
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden mb-10">
          <div className="px-8 py-14 text-center">
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-3">
              Та хүссэн ажлаа хайгаарай
            </h1>
            <p className="text-zinc-400 max-w-xl mx-auto mb-10 text-sm leading-relaxed">
              Нэр, төрөл, цалин болон байршлаар ажлын зарыг шүүж хайна уу
            </p>

            {/* Search tabs */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {SEARCH_TABS.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => handleTabChange(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-5 py-2 rounded-full border text-sm font-medium transition-all',
                    searchType === type
                      ? 'bg-[#2872a1] text-white border-[#2872a1]'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900',
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Search input area */}
            {searchType !== 'location' && (
              <div className="flex justify-center">
                {searchType === 'title' && (
                  <div className="relative w-full max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <Input
                      placeholder="Ажлын нэрээр хайх..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="pl-10 rounded-xl border-zinc-200 h-11 focus-visible:ring-zinc-400"
                    />
                  </div>
                )}

                {searchType === 'category' && (
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full max-w-md rounded-xl border-zinc-200 h-11 focus:ring-zinc-400">
                      <SelectValue placeholder="Ажлын төрөл сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх төрөл</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {searchType === 'salary' && (
                  <div className="relative w-full max-w-md">
                    <Input
                      type="text"
                      placeholder="Доод цалин оруулах..."
                      value={
                        searchValue ? Number(searchValue).toLocaleString() : ''
                      }
                      onChange={(e) =>
                        setSearchValue(e.target.value.replace(/\D/g, ''))
                      }
                      className="pr-8 rounded-xl border-zinc-200 h-11 focus-visible:ring-zinc-400"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">
                      ₮
                    </span>
                  </div>
                )}
              </div>
            )}

            {searchType === 'location' && (
              <div className="w-full max-w-3xl mx-auto">
                {/* Radius сонгогч */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-sm text-zinc-500">Хайлтын радиус:</span>
                  <div className="flex gap-1.5">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRadiusChange(r)}
                        className={cn(
                          'px-3 py-1 rounded-lg border text-xs font-medium transition-all',
                          radius === r
                            ? 'bg-[#2872a1] text-white border-[#2872a1]'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400',
                        )}
                      >
                        {r >= 1000 ? `${r / 1000}км` : `${r}м`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-zinc-200">
                  <NearbySearchMap
                    radius={radius}
                    onSelect={async (lat, lng) => {
                      try {
                        const res = await fetch(
                          `${API_URL}/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
                        );
                        const data = await res.json();
                        setNearbyJobs(
                          Array.isArray(data)
                            ? data
                            : Array.isArray(data.jobs)
                              ? data.jobs
                              : [],
                        );
                      } catch {
                        setNearbyJobs([]);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-400 mt-2.5">
                  Газрын зураг дээр дарж{' '}
                  {radius >= 1000 ? `${radius / 1000}км` : `${radius}м`} радиус
                  доторх ажлыг харах
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Job list header ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-900">
            Нээлттэй ажлууд
            <span className="ml-2 text-sm font-normal text-zinc-400">
              {!loading && `${finalJobs.length} зар`}
            </span>
          </h2>
        </div>

        {/* ── States ── */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-center text-red-500 py-10 text-sm">{error}</p>
        )}
        {!loading && finalJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-300 gap-2">
            <Search size={32} />
            <p className="text-sm">Хайлтад тохирох ажил олдсонгүй</p>
          </div>
        )}

        {/* ── Job grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {finalJobs.map((job) => (
            <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
              <Card className="group h-full border-zinc-200 shadow-none rounded-2xl hover:border-zinc-400 hover:shadow-md transition-all duration-200 bg-white cursor-pointer">
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 text-base leading-tight group-hover:text-zinc-700 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
                        <Building2 size={12} />
                        <span className="truncate">
                          {job.employer?.employerName || 'Байгууллага'}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                      {job.category?.name}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-1">
                    {job.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-zinc-100" />

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow icon={<MapPin size={11} />} text={job.location} />
                    <InfoRow
                      icon={<Users size={11} />}
                      text={`${job.numberOfWorker} хүн`}
                    />
                    <InfoRow
                      icon={<Banknote size={11} />}
                      text={`${job.salary.toLocaleString()} ₮`}
                    />
                    <InfoRow
                      icon={<SlidersHorizontal size={11} />}
                      text={job.category?.name}
                    />
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-1.5 text-xs text-zinc-400 pt-0.5">
                    <Calendar size={11} className="mt-0.5 shrink-0" />
                    <div>
                      <span>{formatDate(job.startTime)}</span>
                      <span className="mx-1 text-zinc-300">→</span>
                      <span>{formatDate(job.endTime)}</span>
                    </div>
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

function InfoRow({
  icon,
  text,
  highlight,
}: {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs truncate',
        highlight ? 'text-emerald-700 font-semibold' : 'text-zinc-500',
      )}
    >
      <span className={highlight ? 'text-emerald-500' : 'text-zinc-400'}>
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </div>
  );
}
