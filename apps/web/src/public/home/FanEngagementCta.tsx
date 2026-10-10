import { ArrowRight, CircleQuestionMark, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { SectionEyebrow } from "../../components/SectionEyebrow.js";
import { useAuthStore } from "../../store/auth.store.js";

/**
 * Homepage fan-engagement CTA card (Module 8 checkpoint: 'Predict Today's
 * Match' / 'Play Quiz'). Shown to signed-in fans; guests are pointed at
 * sign-in, which the header modal owns.
 */
export function FanEngagementCta() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <section id="fan-cta-section" className="bg-pitch-cream py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SectionEyebrow label="Fan Zone" id="fan-cta-eyebrow" />
          <h2 className="mt-1.5 font-display text-3xl font-extrabold text-navy sm:text-4xl">
            Predict &amp; Play
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <CtaCard
            to="/predict"
            icon={<Sparkles className="h-5 w-5" />}
            title="Predict Today's Match"
            body="Call the winner before kickoff and score a point if you're right."
            cta="Make a prediction"
          />
          <CtaCard
            to="/quizzes"
            icon={<CircleQuestionMark className="h-5 w-5" />}
            title="Play a Quiz"
            body="Test your knowledge of the league. One attempt per quiz, highest score wins."
            cta="Take a quiz"
          />
          <CtaCard
            to="/leaderboard"
            icon={<Trophy className="h-5 w-5" />}
            title="Leaderboard"
            body="See where you rank against every other supporter."
            cta="View standings"
          />
        </div>
      </div>
    </section>
  );
}

function CtaCard({
  to,
  icon,
  title,
  body,
  cta,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-pitch-orange-dark">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold text-navy">{title}</h3>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-pitch-orange-dark group-hover:underline">
        <span>{cta}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}