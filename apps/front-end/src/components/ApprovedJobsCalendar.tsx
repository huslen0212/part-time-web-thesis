'use client';

import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { EventContentArg, EventClickArg } from '@fullcalendar/core';
import { MapPin, Clock, Tag, ArrowRight } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

type MyRequest = {
  requestId: number;
  job: {
    jobId: number;
    title: string;
    location?: string;
    category?: string;
    startTime: string;
    endTime: string;
  };
};

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    jobId: number;
    location?: string;
    category?: string;
    endTime: string;
  };
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
  });
  const formattedTime = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formattedDate} ${formattedTime}`;
}

function formatTime(date: Date | null) {
  if (!date) return '';
  return date.toLocaleTimeString('mn-MN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
// Calendar event-iin custom component
function EventPill({
  event,
}: {
  event: {
    title: string;
    start: Date | null;
    extendedProps: CalendarEvent['extendedProps'];
  };
}) {
  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs cursor-pointer w-full overflow-hidden hover:bg-emerald-700 transition-colors">
          <span className="font-medium truncate">{event.title}</span>
          <span className="text-emerald-200 text-[10px] shrink-0">
            {formatTime(event.start)}
          </span>
        </div>
      </HoverCardTrigger>

      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-60 p-0 rounded-2xl overflow-hidden shadow-lg border border-zinc-100 bg-white"
      >
        {/* Colored top stripe */}
        <div className="h-1 bg-emerald-500 w-full" />

        {/* Title */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-sm font-semibold text-zinc-900 leading-snug">
            {event.title}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-zinc-100" />

        {/* Info rows */}
        <div className="px-4 py-3 space-y-2.5">
          {/* Time */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={11} className="text-emerald-600" />
            </div>
            <div className="text-xs text-zinc-600 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {event.start
                    ? formatDateTime(event.start.toISOString())
                    : '—'}
                </span>

                <ArrowRight size={9} className="text-zinc-400" />

                <span className="text-zinc-400">
                  {formatDateTime(event.extendedProps.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          {event.extendedProps.location && (
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-zinc-50 flex items-center justify-center shrink-0">
                <MapPin size={11} className="text-zinc-400" />
              </div>
              <span className="text-xs text-zinc-600 truncate">
                {event.extendedProps.location}
              </span>
            </div>
          )}

          {/* Category */}
          {event.extendedProps.category && (
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-zinc-50 flex items-center justify-center shrink-0">
                <Tag size={11} className="text-zinc-400" />
              </div>
              <span className="text-xs text-zinc-600">
                {event.extendedProps.category}
              </span>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function ApprovedJobsCalendar({
  items,
}: {
  items: MyRequest[];
}) {
  const router = useRouter();

  // backend-s irsen data-g calendar event format-ruu shiljuulne
  const events: CalendarEvent[] = items.map((r) => ({
    id: String(r.requestId),
    title: r.job.title,
    start: r.job.startTime,
    end: r.job.endTime,
    extendedProps: {
      jobId: r.job.jobId,
      location: r.job.location,
      category: r.job.category,
      endTime: r.job.endTime,
    },
  }));

  // Calendar event deer darhad job-iin detail page-ruu yavah function
  const handleEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    router.push(`/jobs/${arg.event.extendedProps.jobId}`);
  };

  return (
    <div className="relative">
      <div
        className="
[&_.fc]:font-sans
[&_.fc-toolbar-title]:text-base
[&_.fc-toolbar-title]:font-bold
[&_.fc-toolbar-title]:text-zinc-800

[&_.fc-button]:rounded-lg
[&_.fc-button]:border-[#2872a1]
[&_.fc-button]:bg-[#2872a1]
[&_.fc-button]:text-white
[&_.fc-button]:text-xs
[&_.fc-button]:font-medium
[&_.fc-button:hover]:bg-[#7f9db1]
[&_.fc-button:hover]:border-[#7f9db1]
[&_.fc-button-primary]:shadow-none
"
      >
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          height={560}
          locale="mn"
          events={events}
          headerToolbar={{ left: 'prev,today', center: 'title', right: 'next' }}
          dayMaxEvents={3}
          eventClick={handleEventClick}
          dayCellClassNames={(arg) => {
            const hasEvent = events.some(
              (e) =>
                new Date(e.start).toDateString() === arg.date.toDateString(),
            );
            return hasEvent ? ['!bg-emerald-50/40'] : [];
          }}
          eventContent={(arg: EventContentArg) => (
            <EventPill
              event={{
                title: arg.event.title,
                start: arg.event.start,
                extendedProps: arg.event
                  .extendedProps as CalendarEvent['extendedProps'],
              }}
            />
          )}
        />
      </div>
    </div>
  );
}
