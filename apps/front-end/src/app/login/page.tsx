'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Нэвтрэхэд алдаа гарлаа');
        return;
      }

      // Save token so homepage can decode username
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      router.push('/');
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold">Нэвтрэх</CardTitle>
          <p className="text-sm text-muted-foreground">
            Цагийн ажил зуучлалын систем
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>И-мэйл</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Нууц үг</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            className="w-full h-11"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Түр хүлээнэ үү...' : 'Нэвтрэх'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Бүртгэлгүй юу?
            <Link href="/register" className="text-primary hover:underline">
              Бүртгүүлэх
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
