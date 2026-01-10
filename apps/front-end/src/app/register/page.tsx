'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type Role = 'JOB_SEEKER' | 'EMPLOYER';

const API_URL = 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | ''>('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [userName, setUserName] = useState('');
  const [jobSeekerPhone, setJobSeekerPhone] = useState('');

  const [employerName, setEmployerName] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    const payload =
      role === 'JOB_SEEKER'
        ? {
            user: { email, password, role },
            jobSeeker: {
              userName,
              phoneNumber: jobSeekerPhone,
            },
          }
        : {
            user: { email, password, role },
            employer: {
              employerName,
              phoneNumber: employerPhone,
            },
          };

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Бүртгэл амжилтгүй');
        return;
      }

      router.push('/login');
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Бүртгүүлэх</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Хэрэглэгчийн төрөл</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Төрөл сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JOB_SEEKER">Ажил хайгч</SelectItem>
                <SelectItem value="EMPLOYER">Ажил олгогч</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {role === 'JOB_SEEKER' && (
            <>
              <Separator />
              <Input
                placeholder="Нэр"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                placeholder="Утас"
                value={jobSeekerPhone}
                onChange={(e) => setJobSeekerPhone(e.target.value)}
              />
            </>
          )}

          {role === 'EMPLOYER' && (
            <>
              <Separator />
              <Input
                placeholder="Байгууллагын нэр"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
              />
              <Input
                placeholder="Утас"
                value={employerPhone}
                onChange={(e) => setEmployerPhone(e.target.value)}
              />
            </>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            className="w-full h-11"
            onClick={handleRegister}
            disabled={!role || loading}
          >
            {loading ? 'Түр хүлээнэ үү...' : 'Бүртгүүлэх'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Бүртгэлтэй юу?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Нэвтрэх
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
