'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Calendar, DollarSign, List, MapPin } from 'lucide-react';
import NearbySearchMap from '@/components/NearbySearchMap';

const API_URL = 'http://localhost:3001';

/* ================= TYPES ================= */

type Job = {
  jobId: number;
  title: string;
  description: string;
  category: string;
  location: string;
  salary: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  employer?: {
    employerName?: string | null;
  };
};

type SearchType = 'title' | 'category' | 'salary' | 'location';

/* ================= HELPERS ================= */

const formatSalary = (value: string) => {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('en-US');
};

/* ================= COMPONENT ================= */

export default function JobSeekerHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchType, setSearchType] = useState<SearchType>('title');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  /* ================= FETCH ALL JOBS ================= */

  useEffect(() => {
    fetch(`${API_URL}/jobs`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      })
      .catch(() => setError('Сервертэй холбогдож чадсангүй'))
      .finally(() => setLoading(false));
  }, []);

  /* ================= FILTER ================= */

  const filteredJobs = jobs.filter((job) => {
    if (searchType === 'title' && searchValue.trim()) {
      return job.title.toLowerCase().includes(searchValue.toLowerCase());
    }

    if (searchType === 'category') {
      if (selectedCategory === 'all') return true;
      return job.category === selectedCategory;
    }

    if (searchType === 'salary' && searchValue) {
      const minSalary = Number(searchValue.replace(/\D/g, ''));
      return job.salary >= minSalary;
    }

    return true;
  });

  const finalJobs =
    searchType === 'location'
      ? Array.isArray(nearbyJobs)
        ? nearbyJobs
        : []
      : filteredJobs;

  /* ================= UI ================= */

  return (
    <section>
      <div className="max-w-7xl mx-auto px-6">
        {/* ================= HERO ================= */}
        <div className="relative mb-16 rounded-2xl overflow-hidden bg-white">
          <div className="px-6 py-20 text-center text-black">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Та хүссэн ажлаа хайгаарай
            </h1>

            <p className="text-black/50 max-w-2xl mx-auto mb-10">
              Нэр, төрөл, цалин болон байршлаар шүүнэ.
            </p>

            <div className="flex flex-col items-center gap-6">
              {/* ===== INPUT ZONE ===== */}
              {searchType !== 'location' && (
                <div className="flex flex-col md:flex-row gap-3 w-full justify-center">
                  {searchType === 'title' && (
                    <input
                      type="text"
                      placeholder="Ажлын нэрээр хайх"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-full md:w-80 px-4 py-3 rounded-lg border border-black"
                    />
                  )}

                  {searchType === 'category' && (
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-full md:w-80 px-4 py-3 border border-black">
                        <SelectValue placeholder="Ажлын төрөл" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Бүх төрөл</SelectItem>
                        <SelectItem value="Үйлчилгээ">Үйлчилгээ</SelectItem>
                        <SelectItem value="Маркетинг">Маркетинг</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Оффис">Оффис</SelectItem>
                        <SelectItem value="Хүргэлт">Хүргэлт</SelectItem>
                        <SelectItem value="Барилга">Барилга</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {searchType === 'salary' && (
                    <div className="relative w-full md:w-80">
                      <input
                        type="text"
                        placeholder="Доод цалин"
                        value={formatSalary(searchValue)}
                        onChange={(e) =>
                          setSearchValue(e.target.value.replace(/\D/g, ''))
                        }
                        className="w-full px-4 py-3 pr-10 rounded-lg border border-black"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        ₮
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ===== LOCATION MAP SEARCH ===== */}
              {searchType === 'location' && (
                <div className="w-full max-w-4xl">
                  <NearbySearchMap
                    onSelect={async (lat, lng) => {
                      try {
                        const res = await fetch(
                          `${API_URL}/jobs/nearby?lat=${lat}&lng=${lng}&radius=500`,
                        );

                        const data = await res.json();

                        // 🔥 CRASH FIX
                        if (Array.isArray(data)) {
                          setNearbyJobs(data);
                        } else if (Array.isArray(data.jobs)) {
                          setNearbyJobs(data.jobs);
                        } else {
                          setNearbyJobs([]);
                        }
                      } catch {
                        setNearbyJobs([]);
                      }
                    }}
                  />

                  <p className="text-sm text-black/60 mt-3">
                    Газрын зураг дээр дарж 500м радиус доторх ажлыг харах
                  </p>
                </div>
              )}

              {/* ===== TABS ===== */}
              <div className="flex flex-wrap gap-2 justify-center">
                {(
                  ['title', 'category', 'salary', 'location'] as SearchType[]
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSearchType(type);
                      setSearchValue('');
                      setSelectedCategory('all');
                      setNearbyJobs([]);
                    }}
                    className={`px-6 py-2 rounded-full border border-black
                      ${
                        searchType === type
                          ? 'bg-black text-white'
                          : 'bg-white text-black'
                      }`}
                  >
                    {type === 'title' && 'Нэрээр'}
                    {type === 'category' && 'Төрлөөр'}
                    {type === 'salary' && 'Цалингаар'}
                    {type === 'location' && 'Байршлаар'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= LIST ================= */}
        <h3 className="text-xl font-semibold mb-6">Нээлттэй ажлууд</h3>

        {loading && <p className="text-center">Ачаалж байна...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && finalJobs.length === 0 && (
          <p className="text-center">Хайлтад тохирох ажил олдсонгүй</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalJobs.map((job) => (
            <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
              <Card className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle>{job.title}</CardTitle>
                  <p className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {job.employer?.employerName || 'Байгууллага'}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <p className="line-clamp-3">{job.description}</p>

                  <div className="flex gap-2 items-center">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </div>
                  <div className="flex gap-2 items-center">
                    <List className="w-4 h-4" /> {job.category}
                  </div>
                  <div className="flex gap-2 items-center">
                    <DollarSign className="w-4 h-4" />
                    {job.salary.toLocaleString()} ₮
                  </div>
                  <div className="flex gap-2 items-start text-black/60">
                    <Calendar className="w-4 h-4 mt-1" />
                    <div>
                      Эхлэх: {new Date(job.startTime).toLocaleString('mn-MN')}
                      <br />
                      Дуусах: {new Date(job.endTime).toLocaleString('mn-MN')}
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
