import Link from 'next/link'
import { CheckCircle2, Heart, Palette, PlusCircle, QrCode, Star, Trophy } from 'lucide-react'

const STEPS = [
  {
    icon: PlusCircle,
    title: 'Create',
    desc: 'Set up your private event dashboard in seconds. Choose your wedding date and venue.',
  },
  {
    icon: Palette,
    title: 'Personalise',
    desc: 'Upload photos, write trivia questions about your story, and select game themes.',
  },
  {
    icon: QrCode,
    title: 'Share',
    desc: 'Display your custom QR code on tables. Guests scan and play — no app download required.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'Our guests were so engaged! It really helped our two families mingle and the trivia questions brought so many laughs.',
    name: 'Emily R.',
    role: 'Bride, 2023',
  },
  {
    quote:
      'The setup was effortless. I was worried it would be too much work, but the platform makes it so easy to personalise.',
    name: 'David M.',
    role: 'Groom, 2024',
  },
  {
    quote:
      'As a bridesmaid, I managed the game during the reception. It was the perfect bridge during the cocktail hour!',
    name: 'Sophia L.',
    role: 'Maid of Honor',
  },
]

const TRIVIA_ANSWERS = ['The Coffee Shop', 'The Art Gallery', 'Central Park', 'The Rooftop Bar']
const LEADERBOARD = [
  { name: 'Aunt Linda', score: '2400' },
  { name: 'Best Man Tom', score: '2350', highlight: true },
  { name: 'Cousin Mia', score: '2100' },
]

export default function LandingPage() {
  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 border-b border-border/30 bg-white/90 shadow-sm backdrop-blur-sm">
        <nav className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
          <div className="font-serif italic text-2xl text-primary">Our Wedding Game</div>
          <div className="hidden gap-8 md:flex">
            {['How It Works', 'Features', 'Stories'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7b5455 0%, #a67c7d 100%)' }}
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-20 pt-20 md:pb-28 md:pt-28">
          <div
            className="absolute inset-0 -z-10 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#d4c2c2 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-2">
            <div className="space-y-6 text-center md:text-start">
              <span className="inline-block rounded-full bg-wedding-primary-container/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Elevate Your Big Day
              </span>
              <h1 className="font-serif text-4xl font-bold leading-tight text-foreground md:text-5xl">
                Bring Guests Together with Romantic Play
              </h1>
              <p className="mx-auto max-w-lg text-base text-muted-foreground md:mx-0">
                Turn your celebration into an unforgettable interactive experience. From charming
                trivia about your journey to fun Passing Cards that bridge every table.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <Link
                  href="/signup"
                  className="rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #7b5455 0%, #a67c7d 100%)' }}
                >
                  Start Your Game
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-primary px-8 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Mock trivia UI */}
            <div className="relative hidden md:block">
              <div
                className="rotate-3 rounded-2xl bg-white p-1 shadow-2xl"
                style={{ boxShadow: '0 0 30px rgba(241,202,80,0.2), 0 20px 60px rgba(0,0,0,0.12)' }}
              >
                <div className="space-y-4 rounded-xl bg-wedding-surface-container p-6">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-semibold text-primary">Question 3 of 10</span>
                  </div>
                  <p className="font-serif text-lg font-semibold text-foreground">
                    Where did the couple have their first date?
                  </p>
                  <div className="space-y-2">
                    {TRIVIA_ANSWERS.map((answer, i) => (
                      <div
                        key={answer}
                        className={`rounded-lg border px-4 py-2.5 text-sm ${
                          i === 1
                            ? 'border-wedding-tertiary-container bg-wedding-tertiary-container/20 font-semibold text-primary'
                            : 'border-border bg-white text-foreground'
                        }`}
                      >
                        {answer}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="-rotate-6 absolute -bottom-2 -start-2 rounded-lg bg-wedding-tertiary-container px-4 py-2 text-sm font-semibold shadow-md">
                "Best wedding activity ever!"
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────────────────────── */}
        <section id="how-it-works" className="px-6 py-20 bg-muted">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground">Three Steps to Joy</h2>
              <p className="mt-3 text-muted-foreground">
                Seamlessly integrate fun into your wedding schedule.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="space-y-4 rounded-2xl border border-border/20 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wedding-primary-container text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-primary">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-[1200px] space-y-20">
            {/* Trivia */}
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="font-serif text-3xl font-bold text-foreground">
                  Table-to-Table Trivia
                </h2>
                <p className="text-muted-foreground">
                  Challenge your guests to see who knows the couple best. Our dynamic leaderboard
                  keeps the competitive spirit high while celebrating your love story.
                </p>
                <ul className="space-y-3">
                  {[
                    'Fully customisable question sets',
                    'Real-time live leaderboard',
                    'Automated winner announcements',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle2 className="h-5 w-5 shrink-0 fill-wedding-primary-container text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 rounded-xl border border-border/20 bg-white p-4 shadow-lg">
                  <div className="h-2 w-1/2 rounded-full bg-wedding-primary-container" />
                  <p className="font-serif text-base font-semibold text-primary">Trivia Card</p>
                  <p className="text-xs italic text-muted-foreground">
                    Where did they have their first date?
                  </p>
                  <div className="space-y-1">
                    <div className="rounded border border-border px-2 py-1.5 text-xs">Coffee Shop</div>
                    <div className="rounded border-2 border-wedding-tertiary-container bg-wedding-tertiary-container/10 px-2 py-1.5 text-xs font-bold">
                      The Art Gallery
                    </div>
                    <div className="rounded border border-border px-2 py-1.5 text-xs">Central Park</div>
                  </div>
                </div>
                <div className="mt-10 space-y-3 rounded-xl border border-border/20 bg-white p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Rankings
                    </span>
                    <Trophy className="h-4 w-4 text-wedding-tertiary" />
                  </div>
                  <div className="space-y-1.5">
                    {LEADERBOARD.map(({ name, score, highlight }, i) => (
                      <div
                        key={name}
                        className={`flex justify-between text-sm ${highlight ? 'font-bold text-primary' : 'text-foreground'}`}
                      >
                        <span>
                          {i + 1}. {name}
                        </span>
                        <span>{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Passing Cards */}
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div className="order-2 flex items-center justify-center rounded-3xl border border-primary/10 bg-primary/5 p-10 lg:order-1">
                <div className="max-w-xs space-y-4 rounded-xl bg-secondary/40 p-6 text-center">
                  <Heart className="mx-auto h-8 w-8 text-primary" />
                  <p className="font-serif text-lg font-semibold text-foreground">Passing Card</p>
                  <p className="text-sm italic text-muted-foreground">
                    "Find the person at Table 4 who has known the groom the longest and take a
                    selfie!"
                  </p>
                </div>
              </div>
              <div className="order-1 space-y-6 lg:order-2">
                <h2 className="font-serif text-3xl font-bold text-foreground">
                  Interactive 'Passing Cards'
                </h2>
                <p className="text-muted-foreground">
                  Break the ice between different circles of friends. Digital Passing Cards prompt
                  guests to find someone they don't know and share a memory or a toast.
                </p>
                <div className="rounded-xl border border-secondary bg-secondary p-6 text-sm italic text-foreground/80">
                  "Find the person at Table 4 who has known the groom the longest and take a
                  selfie!"
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────────────────────── */}
        <section id="stories" className="bg-white px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground">Cherished Memories</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map(({ quote, name, role }) => (
                <div
                  key={name}
                  className="space-y-4 rounded-xl border border-border/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex text-wedding-tertiary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground">"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wedding-primary-container">
                      <span className="text-sm font-bold text-primary">{name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <section className="border-t border-border/20 bg-wedding-primary-container/10 px-6 py-20">
          <div className="mx-auto max-w-[1200px] space-y-6 text-center">
            <h2 className="font-serif text-4xl font-bold text-primary">Ready to play?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Join hundreds of couples who have transformed their wedding day with Our Wedding Game.
              Start building your custom trivia event for free today.
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
            >
              Launch Your Game
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/10 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="font-serif italic text-2xl text-primary/50">Our Wedding Game</div>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-primary"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-primary"
            >
              Terms of Service
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Our Wedding Game. Crafted with love.
          </p>
        </div>
      </footer>
    </>
  )
}
