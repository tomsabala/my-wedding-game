# Game Flow

## 1. Entry

Player scans the wedding QR code (or opens the share link).

They land on the game page for that specific couple. The page shows:
- Couple names and wedding date
- A name entry form (first name required, last name optional)
- A "Join Game" button

On submit the player's display name is saved and a local session begins. No account needed.

If the game is not live (couple took it offline), the page shows a friendly "The game isn't active right now" message.

---

## 2. Gameplay Loop

The game proceeds through all questions in the order set by the couple.

### For each question:

**2a. Question Screen**

- Question text displayed prominently.
- 4 answer options shown as large tap-friendly buttons.
- A countdown timer runs (visible to the player — e.g., 20 seconds per question).
- Timer starts the moment the question renders.

**2b. Answer Selection**

- Player taps an answer.
- Buttons immediately lock (no re-selection).
- Correct answer highlights green, selected wrong answer highlights red.
- Time taken is recorded at the moment of tap.

**2c. Passing Card (if assigned)**

After the answer feedback, if the couple has placed a passing card after this question, it appears automatically:

| Card Type | Display |
|-----------|---------|
| Did You Know | Decorative card with a fun fact or story about the couple. "Continue" button to proceed. |
| Photo with Caption | Full-width photo with caption text below. "Continue" button to proceed. |
| Video Clip | Autoplay muted video. "Continue" appears after playback ends, or as a "Skip" after 3 seconds. |

If no passing card is assigned after this question, the next question loads immediately after a brief pause.

**2d. Next Question**

Repeat from 2a until all questions are answered.

---

## 3. Scoring

Score is calculated per question:

```
question_score = base_points - time_penalty

base_points   = 1000  (awarded only for a correct answer; 0 for wrong)
time_penalty  = floor(time_taken_ms / 1000) × 50
                (capped so minimum correct-answer score is 100)
```

Wrong answers score 0 regardless of speed.

Final score = sum of all question scores.

Tiebreaker: if two players have the same score, the one who finished faster ranks higher.

---

## 4. End Screen & Leaderboard

After the last question is answered (and its passing card, if any, is dismissed):

- The player sees their total score and final rank.
- The top 3 players are shown with 1st / 2nd / 3rd place visual treatment (podium style).
- The full ranked list is shown below, including the current player highlighted.
- The leaderboard updates live as other players finish (polling every 5 seconds).
- A "Play Again" button resets the session back to the name entry screen.

---

## 5. State Transitions (summary)

```
[Name Entry]
     ↓  join
[Question N]
     ↓  answer selected
[Answer Feedback]  (1–2s)
     ↓  if passing card exists
[Passing Card]
     ↓  continue / skip
[Question N+1]  …repeat…
     ↓  after last question
[End Screen / Leaderboard]
     ↓  play again
[Name Entry]
```

---

## 6. Edge Cases

| Situation | Behavior |
|-----------|----------|
| Timer runs out with no answer | Treated as wrong answer, 0 points, move on |
| Player closes browser mid-game | Session lost; they can re-enter their name and start again (creates a new player record) |
| Game taken offline mid-session | Player can finish their current session; new joins are blocked |
| Duplicate display name | Allowed — players are identified by a generated session ID, not their name |
| No passing cards created | Gameplay proceeds with no cards; loop is just question → question |
