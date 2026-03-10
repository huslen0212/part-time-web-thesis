'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Role = 'JOB_SEEKER' | 'EMPLOYER';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

const API_URL = 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // JOB_SEEKER fields
  const [userName, setUserName] = useState('');
  const [jobSeekerPhone, setJobSeekerPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [address, setAddress] = useState('');

  // EMPLOYER fields
  const [employerName, setEmployerName] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{8}$/;

  const handleRegister = async () => {
    if (!role) return toast.warning('Хэрэглэгчийн төрөл сонгоно уу');
    if (!email) return toast.warning('Имэйл хаягаа оруулна уу');
    if (!emailRegex.test(email))
      return toast.warning('Имэйл хаяг буруу форматтай байна');
    if (!password) return toast.warning('Нууц үгээ оруулна уу');
    if (!confirmPassword) return toast.warning('Нууц үгээ давтан оруулна уу');
    if (password !== confirmPassword)
      return toast.warning('Нууц үг таарахгүй байна');

    if (role === 'JOB_SEEKER') {
      if (!userName) return toast.warning('Нэрээ оруулна уу');
      if (!jobSeekerPhone) return toast.warning('Утасны дугаараа оруулна уу');
      if (!phoneRegex.test(jobSeekerPhone))
        return toast.warning('Утасны дугаар 8 оронтой байх ёстой');
      if (!birthDate) return toast.warning('Төрсөн огноогоо оруулна уу');
      if (!gender) return toast.warning('Хүйсээ сонгоно уу');
      if (!address) return toast.warning('Хаягаа оруулна уу');
    }

    if (role === 'EMPLOYER') {
      if (!employerName) return toast.warning('Байгууллагын нэрээ оруулна уу');
      if (!employerPhone) return toast.warning('Утасны дугаараа оруулна уу');
      if (!phoneRegex.test(employerPhone))
        return toast.warning('Утасны дугаар 8 оронтой байх ёстой');
    }

    const payload =
      role === 'JOB_SEEKER'
        ? {
            user: { email, password, role },
            jobSeeker: {
              userName,
              phoneNumber: jobSeekerPhone,
              birthDate,
              gender,
              address,
            },
          }
        : {
            user: { email, password, role },
            employer: { employerName, phoneNumber: employerPhone },
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

  const inputClass =
    'h-11 border-[#CBDDE9] focus-visible:ring-[#2872A1] focus-visible:border-[#2872A1] rounded-xl text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-1">Бүртгүүлэх</h2>
          <p className="text-sm text-gray-500">Мэдээллээ бөглөж эхэлнэ үү.</p>
        </div>

        {/* Role selector - full width */}
        <div className="space-y-1.5 mb-6">
          <label className="text-sm font-medium text-black">
            Хэрэглэгчийн төрөл
          </label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JOB_SEEKER">Ажил хайгч</SelectItem>
              <SelectItem value="EMPLOYER">Ажил олгогч</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Two-column layout — shown after role selected */}
        {role && (
          <>
            <div className="grid grid-cols-2 gap-8 items-start">
              {/* ── LEFT: Үндсэн мэдээлэл ── */}
              <div className="space-y-4">
                <Divider label="Үндсэн мэдээлэл" />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-black">
                    И-мэйл
                  </label>
                  <Input
                    type="email"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-black">
                    Нууц үг
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-black">
                    Нууц үг давтах
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-400 focus-visible:ring-red-400'
                        : confirmPassword && password === confirmPassword
                          ? 'border-green-400 focus-visible:ring-green-400'
                          : ''
                    }`}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Нууц үг таарахгүй байна
                    </p>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Хувийн / Байгууллагын мэдээлэл ── */}
              <div className="space-y-4">
                <Divider
                  label={
                    role === 'JOB_SEEKER'
                      ? 'Хувийн мэдээлэл'
                      : 'Байгууллагын мэдээлэл'
                  }
                />

                {role === 'JOB_SEEKER' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Нэр
                      </label>
                      <Input
                        placeholder="Таны нэр"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Утасны дугаар
                      </label>
                      <Input
                        placeholder="99xxxxxx"
                        value={jobSeekerPhone}
                        maxLength={8}
                        inputMode="numeric"
                        onChange={(e) =>
                          setJobSeekerPhone(e.target.value.replace(/\D/g, ''))
                        }
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Төрсөн огноо
                      </label>
                      <Input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Хүйс
                      </label>
                      <Select
                        value={gender}
                        onValueChange={(v) => setGender(v as Gender)}
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Эрэгтэй</SelectItem>
                          <SelectItem value="FEMALE">Эмэгтэй</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Хаяг
                      </label>
                      <Input
                        placeholder="Улаанбаатар, БГД, ХX-р хороо,... "
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </>
                )}

                {role === 'EMPLOYER' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Байгууллагын нэр
                      </label>
                      <Input
                        placeholder="Компанийн нэр"
                        value={employerName}
                        onChange={(e) => setEmployerName(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-black">
                        Утасны дугаар
                      </label>
                      <Input
                        placeholder="99xxxxxx"
                        value={employerPhone}
                        maxLength={8}
                        inputMode="numeric"
                        onChange={(e) =>
                          setEmployerPhone(e.target.value.replace(/\D/g, ''))
                        }
                        className={inputClass}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit button - full width */}
            <Button
              className="w-full h-11 rounded-xl bg-[#2872A1] hover:bg-[#1f5c82] text-white font-semibold text-sm transition-all mt-8"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Түр хүлээнэ үү...
                </span>
              ) : (
                'Бүртгүүлэх'
              )}
            </Button>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Бүртгэлтэй юу?{' '}
          <Link
            href="/login"
            className="text-[#2872A1] font-semibold hover:underline"
          >
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[#CBDDE9]" />
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-[#CBDDE9]" />
    </div>
  );
}
