'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventContentArg } from '@fullcalendar/core';

type MyRequest = {
  requestId: number;
  job: {
    title: string;
    startTime: string;
    endTime: string;
  };
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
};

export default function ApprovedJobsCalendar({
  items,
}: {
  items: MyRequest[];
}) {
  const events: CalendarEvent[] = items.map((r) => ({
    id: String(r.requestId),
    title: r.job.title,
    start: r.job.startTime,
    end: r.job.endTime,
  }));

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString('mn-MN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        height={600}
        locale="mn"
        events={events}
        headerToolbar={{
          left: 'prev, today',
          center: 'title',
          right: 'next',
        }}
        dayMaxEvents={3}
        dayCellClassNames={(arg) => {
          const hasEvent = events.some((e) => {
            const eventDate = new Date(e.start).toDateString();
            const cellDate = arg.date.toDateString();
            return eventDate === cellDate;
          });
          return hasEvent ? ['bg-green-200'] : [];
        }}
        eventContent={(arg: EventContentArg) => (
          <div className="flex flex-col gap-0.5 px-1 py-0.5 text-xs">
            <div className="font-semibold truncate text-gray-900">
              {arg.event.title}
            </div>
            <div className="text-gray-700 text-[11px]">
              {formatTime(arg.event.start)} – {formatTime(arg.event.end)}
            </div>
          </div>
        )}
      />
    </div>
  );
}
