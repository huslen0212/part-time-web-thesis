// apps/front-end/src/components/RatingModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { Rating } from '@mui/material';
import type { SyntheticEvent } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PendingRating {
  jobId: string;
  jobTitle: string;
  toUserId: number;
}

export default function RatingModal() {
  const [pending, setPending] = useState<PendingRating[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:3001/ratings/pending', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const valid = Array.isArray(data)
          ? data.filter((item) => item?.jobTitle && item?.toUserId)
          : [];
        setPending(valid);
      });
  }, []);

  const current = pending[0];

  const handleSkip = () => {
    setScore(null);
    setComment('');
    setPending((prev) => prev.slice(1));
  };

  const handleSubmit = async () => {
    if (!score) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3001/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: current.jobId,
          toUserId: current.toUserId,
          score,
          comment,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Үнэлгээ амжилттай илгээгдлээ!', {
        description: `${current.jobTitle} — ${'★'.repeat(score)}${'☆'.repeat(5 - score)}`,
      });
    } catch {
      toast.error('Үнэлгээ илгээхэд алдаа гарлаа', {
        description: 'Дахин оролдоно уу.',
      });
    }

    setScore(null);
    setComment('');
    setPending((prev) => prev.slice(1));
  };

  return (
    <Dialog open={pending.length > 0}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Үнэлгээ өгөх</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {current?.jobTitle} ажил хийсэн ажилтанд үнэлгээ өгнө үү.
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Rating
            name="job-rating"
            value={score}
            onChange={(_: SyntheticEvent, newValue: number | null) =>
              setScore(newValue)
            }
            size="large"
          />
        </div>

        <Textarea
          placeholder="Сэтгэгдэл бичих..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        {pending.length > 1 && (
          <p className="text-xs text-muted-foreground">
            {pending.length} үнэлгээ хүлээж байна
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleSkip}>
            Алгасах
          </Button>
          <Button className="flex-1" disabled={!score} onClick={handleSubmit}>
            Илгээх
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
