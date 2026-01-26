'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{8}$/;

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!role) {
      toast.warning('Хэрэглэгчийн төрөл сонгоно уу');
      return;
    }

    if (!email) {
      toast.warning('Имэйл хаягаа оруулна уу');
      return;
    }

    if (!password) {
      toast.warning('Нууц үгээ оруулна уу');
      return;
    }

    if (!emailRegex.test(email)) {
      toast.warning('Имэйл хаяг буруу форматтай байна');
      return;
    }

    if (role === 'JOB_SEEKER') {
      if (!userName) {
        toast.warning('Нэрээ оруулна уу');
        return;
      }

      if (!jobSeekerPhone) {
        toast.warning('Утасны дугаараа оруулан уу');
        return;
      }

      if (!phoneRegex.test(jobSeekerPhone)) {
        toast.warning('Утасны дугаар 8 оронтой байх ёстой');
        return;
      }
    }

    if (role === 'EMPLOYER') {
      if (!employerName) {
        toast.warning('Нэрээ оруулна уу');
        return;
      }

      if (!employerPhone) {
        toast.warning('Утасны дугаараа оруулан уу');
        return;
      }

      if (!phoneRegex.test(employerPhone)) {
        toast.warning('Утасны дугаар 8 оронтой байх ёстой');
        return;
      }
    }

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

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Бүртгэл амжилтгүй');
        return;
      }

      toast.success('Бүртгэл амжилттай. Нэвтэрч орно уу');
      router.push('/login');
    } catch {
      toast.error('Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Бүртгүүлэх</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Хэрэглэгчийн төрөл</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JOB_SEEKER">Ажил хайгч</SelectItem>
                <SelectItem value="EMPLOYER">Ажил олгогч</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

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
                maxLength={8}
                inputMode="numeric"
                onChange={(e) =>
                  setJobSeekerPhone(e.target.value.replace(/\D/g, ''))
                }
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
                maxLength={8}
                inputMode="numeric"
                onChange={(e) =>
                  setEmployerPhone(e.target.value.replace(/\D/g, ''))
                }
              />
            </>
          )}

          <Button
            className="w-full"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? 'Түр хүлээнэ үү...' : 'Бүртгүүлэх'}
          </Button>

          <div className="text-center text-sm">
            Бүртгэлтэй юу?{' '}
            <Link href="/login" className="text-primary underline">
              Нэвтрэх
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

