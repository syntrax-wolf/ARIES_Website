import { useState } from "react";

const faqs = [
  {
    q: "Who can join Aries?",
    a: "Any student at IIT Delhi with curiosity and a passion for AI. No matter your branch or year, you're welcome here.",
  },
  {
    q: "Do I need prior experience in AI?",
    a: "Not at all. We run from-zero workshops every semester — curiosity matters more than experience.",
  },
  {
    q: "How much time commitment is required?",
    a: "As much as you want to put in. Most members spend a few hours a week; project leads a bit more around deadlines.",
  },
  {
    q: "What kind of projects does Aries build?",
    a: "Everything from research prototypes and hackathon builds to industry collaborations — NLP, vision, robotics and more.",
  },
  {
    q: "Are there any selection rounds?",
    a: "Core team positions have a short selection process each year, but events, workshops and most projects are open to everyone.",
  },
  {
    q: "Can first years join?",
    a: "Absolutely — first years are the heart of the club. Our intro workshops are designed with you in mind.",
  },
];

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <article key={f.q} className="rounded-xl bg-white/80 shadow-card-sm backdrop-blur-sm">
            <button
              className="flex w-full items-center gap-4 px-4 py-4 text-left md:gap-5 md:px-5 md:py-5"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="purple-icon-gradient grid size-9 shrink-0 place-items-center rounded-full text-sm font-black text-white shadow-cta md:size-10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-base font-bold text-ink md:text-[20px]">{f.q}</span>
              <span className="text-2xl font-light text-ink" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="mx-4 mb-4 ml-[52px] rounded-lg bg-lilac-2 px-4 py-3 text-sm font-medium leading-7 text-ink md:mx-5 md:mb-5 md:ml-[60px] md:text-base">
                  {f.a}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
