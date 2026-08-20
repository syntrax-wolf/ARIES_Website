import { Clock, MapPin, ArrowRight } from "lucide-react";
import type { AriesEvent } from "../../lib/types";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function EventCard({
  event,
  variant = "upcoming",
}: {
  event: AriesEvent;
  variant?: "upcoming" | "past";
}) {
  const d = new Date(event.date + "T00:00:00");

  return (
    <a
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#ece1d7] bg-[#fffaf5] shadow-[0px_9px_19px_rgba(22,20,40,0.05)] transition-transform hover:-translate-y-1"
    >
      <div
        className="relative h-40 shrink-0 p-4"
        style={
          event.image
            ? undefined
            : {
                backgroundImage:
                  variant === "past"
                    ? "radial-gradient(220px 160px at 70% 80%, rgba(125,91,184,0.65), transparent 70%), linear-gradient(90deg, #080d24, #10172b)"
                    : "radial-gradient(260px 200px at 20% 85%, rgba(125,91,184,1), transparent 55%), linear-gradient(90deg, #080d24, #080d24)",
              }
        }
      >
        {event.image && (
          <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="relative z-10 flex w-12 flex-col items-center gap-1 rounded-md bg-[#fffaf4] py-1.5 shadow-lg">
          <span className="text-[10px] text-[#344052]">{MONTHS[d.getMonth()]}</span>
          <span className="text-lg font-bold leading-none text-[#081634]">{d.getDate()}</span>
          <span className="text-[10px] text-[#344052]">{DAYS[d.getDay()]}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5b4eb5]">{event.type}</p>
        <h3 className="mt-2 font-serif text-2xl font-bold text-[#081634]">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#354052]">{event.description}</p>

        {variant === "upcoming" && (event.startTime || event.venue) && (
          <div className="mt-4 space-y-2 border-t border-[#e8ddd2] pt-4 text-xs text-[#081634]">
            {event.startTime && (
              <p className="flex items-center gap-2">
                <Clock size={15} className="text-[#5b4eb5]" />
                {event.startTime}
                {event.endTime && ` - ${event.endTime}`}
              </p>
            )}
            {event.venue && (
              <p className="flex items-center gap-2">
                <MapPin size={15} className="text-[#5b4eb5]" />
                {event.venue}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-[#efe5db] pt-4 text-sm font-bold text-[#081634]">
          View Details
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </a>
  );
}
