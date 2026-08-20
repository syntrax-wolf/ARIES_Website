import { MessageSquare, Send } from "lucide-react";
import { clubEmail } from "../../config/socials";

export function ContactForm() {
  return (
    <form
      className="rounded-2xl bg-white p-7 shadow-card-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();
        const subject = String(data.get("subject") ?? "").trim();
        const message = String(data.get("message") ?? "").trim();
        const body = [`Name: ${name}`, `Email: ${email}`, "", message].join("\n");

        window.location.href = `mailto:${clubEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-lilac text-purple">
          <MessageSquare size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-ink">Update or add your profile</h2>
          <p className="text-xs text-ink/60">
            Tell us what to change or share your details if you&rsquo;re not listed yet.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Your Name" name="name" placeholder="Enter your name" />
        <Field label="Email Address" name="email" type="email" placeholder="you@example.com" />
      </div>
      <Field
        className="mt-4"
        label="Subject"
        name="subject"
        placeholder="Update or add my alumni profile"
      />
      <label className="mt-4 block">
        <span className="text-xs font-semibold text-ink">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Share your name, role, org, and any links or updates you'd like on the alumni page..."
          className="mt-2 w-full rounded-lg bg-[#f3eef8] px-4 py-3 text-sm text-ink outline-none placeholder-[#9a95b3] focus:ring-2 focus:ring-purple/40"
        />
      </label>

      <button
        type="submit"
        className="mt-6 flex items-center gap-2 rounded-lg bg-purple px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
      >
        Send Message <Send size={15} />
      </button>
      <p className="mt-3 text-xs text-ink/50">
        This opens your email app with the message addressed to {clubEmail}.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg bg-[#f3eef8] px-4 py-3 text-sm text-ink outline-none placeholder-[#9a95b3] focus:ring-2 focus:ring-purple/40"
      />
    </label>
  );
}
