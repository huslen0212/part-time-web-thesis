'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

/* ===== JWT payload ===== */
type JwtPayload = {
  userId: number;
  role: 'JOB_SEEKER' | 'EMPLOYER';
  userName: string;
  exp: number;
};

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const API_URL = 'http://localhost:3001';

export default function CreateJobPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ===== Form states ===== */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  /* ===== Auth guard ===== */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    // ⏱ token хугацаа шалгах
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }

    // 👮 employer биш бол
    if (decoded.role !== 'EMPLOYER') {
      router.push('/');
      return;
    }
  }, [router]);

  /* ===== Validation ===== */
  const isInvalid =
    !title ||
    !description ||
    !location ||
    !category ||
    !salary ||
    !startTime ||
    !endTime;

  const handleSubmit = async () => {
    if (isInvalid) {
      setError('Бүх талбарыг бөглөнө үү');
      return;
    }

    setLoading(true);
    setError('');

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

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Ажил нэмэхэд алдаа гарлаа');
        return;
      }

      router.push('/');
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card className="w-full max-w-xl border-black/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Шинэ ажил нэмэх
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Ажлын гарчиг</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Тайлбар</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Байршил</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Төрөл</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Ажлын төрөл сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Үйлчилгээ">Үйлчилгээ</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Борлуулалт">Борлуулалт</SelectItem>
                <SelectItem value="Оффис">Оффис</SelectItem>
                <SelectItem value="Хүргэлт">Хүргэлт</SelectItem>
                <SelectItem value="Бусад">Бусад</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Цалин (₮)</Label>
            <Input
              type="number"
              value={salary}
              onChange={(e) =>
                setSalary(e.target.value ? Number(e.target.value) : '')
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Эхлэх цаг</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Дуусах цаг</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || isInvalid}
          >
            {loading ? 'Хадгалж байна...' : 'Ажил нэмэх'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
