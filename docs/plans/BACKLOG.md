# Backlog

## In Progress / Remaining

1. **Performance** — Suspense boundaries and skeleton screens; DB optimisations and optimistic UI shipped in performance-v2
2. **Home page translation** — i18n/l10n of the marketing landing page (`next-intl` configured for Hebrew but marketing page has hardcoded English strings)
3. **Welcome page redesign** — Full-viewport welcome screen; make the Start button much larger and visually dominant ("eye-catcher")
4. **"Lock answer" wording** — Rephrase the lock-answer UI copy to be clearer/more natural
5. **Full name input** — Require guests to enter their full name (first + last) rather than just a display name
6. **Exclude unfinished players from leaderboard** — Only show players who have completed all questions on the leaderboard
7. **Realtime leaderboard live updates** — Live score updates as players finish questions; if full Realtime is too complex, show a friendly "results will appear once everyone finishes" message instead

## Done

- **Game deployment** — deploy/undeploy, QR code download, slug-based sharing
- **Cards edit** — full drag/resize/rotate visual editor
- **Media upload** — Supabase Storage, images + video, 25 MB limit
- **Game UI fine tune** — timer, answer feedback, transitions, wedding theme
- **Statistics and live leaderboard** — Realtime leaderboard via Supabase Realtime (merged in performance-v2)
- **Guest name input** — name form before game, stored in `Player.displayName`
