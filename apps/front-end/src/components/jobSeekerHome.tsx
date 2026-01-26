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

const API_URL = 'http://localhost:3001';

/* ---------- types ---------- */

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

type SearchType = 'title' | 'salary';

/* ---------- component ---------- */

export default function JobSeekerHome() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchType, setSearchType] = useState<SearchType>('title');
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  /* ---------- fetch jobs ---------- */

  useEffect(() => {
    fetch(`${API_URL}/jobs`)
      .then((res) => res.json())
      .then((data: Job[]) => setJobs(data))
      .catch(() => setError('Сервертэй холбогдож чадсангүй'))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- filter logic ---------- */

  const filteredJobs = jobs.filter((job) => {
    // category filter
    if (selectedCategory !== 'all' && job.category !== selectedCategory) {
      return false;
    }

    // text / salary filter
    if (!searchValue.trim()) return true;

    if (searchType === 'title') {
      return job.title.toLowerCase().includes(searchValue.toLowerCase());
    }

    if (searchType === 'salary') {
      return job.salary >= Number(searchValue || 0);
    }

    return true;
  });

  /* ---------- UI ---------- */

  return (
    <section>
      <div className="max-w-7xl mx-auto px-6">

        {/* ================= HERO ================= */}
<div className="relative mb-16 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600">
  <div className="px-6 py-20 text-center text-white">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">
      Та хүссэн ажлаа хайгаарай
    </h1>

    <p className="text-white/90 max-w-2xl mx-auto mb-10">
      Өөрт тохирсон ажлыг төрөл, нэр, цалингаар шүүн олох боломжтой.
    </p>

    {/* ================= FILTERS ================= */}
    <div className="flex flex-col items-center gap-4">

      {/* search + category */}
      <div className="flex flex-col md:flex-row gap-3 w-full justify-center">
        {/* search bar */}
        <input
          type={searchType === 'salary' ? 'number' : 'text'}
          placeholder={
            searchType === 'title'
              ? 'Ажлын нэрээр хайх'
              : 'Доод цалин оруулах'
          }
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full md:w-80 px-4 py-3 rounded-lg text-black text-sm outline-none"
        />

        {/* category dropdown */}
        <Select
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-full md:w-56 bg-white text-black">
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
      </div>

      {/* tabs under search */}
      <div className="flex gap-2">
        <button
          onClick={() => setSearchType('title')}
          className={`px-6 py-2 rounded-full text-sm transition ${
            searchType === 'title'
              ? 'bg-black text-white'
              : 'bg-white text-black'
          }`}
        >
          Нэрээр
        </button>

        <button
          onClick={() => setSearchType('salary')}
          className={`px-6 py-2 rounded-full text-sm transition ${
            searchType === 'salary'
              ? 'bg-black text-white'
              : 'bg-white text-black'
          }`}
        >
          Цалингаар
        </button>
      </div>
    </div>
  </div>
</div>


        {/* ================= LIST ================= */}
        <h3 className="text-xl font-semibold mb-6 text-black/80">
          Нээлттэй ажлууд
        </h3>

        {loading && (
          <p className="text-center text-black/60">Ачаалж байна...</p>
        )}

        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && filteredJobs.length === 0 && (
          <p className="text-center text-black/60">
            Хайлтад тохирох ажил олдсонгүй
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <Link key={job.jobId} href={`/jobs/${job.jobId}`}>
              <Card className="border-black/10 hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle>{job.title}</CardTitle>
                  <p className="text-sm text-black/60 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {job.employer?.employerName || 'Байгууллага'}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm line-clamp-3">{job.description}</p>

                  <div className="text-sm space-y-1">
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
                        <div>
                          Эхлэх:{' '}
                          {new Date(job.startTime).toLocaleString('mn-MN')}
                        </div>
                        <div>
                          Дуусах:{' '}
                          {new Date(job.endTime).toLocaleString('mn-MN')}
                        </div>
                      </div>
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
