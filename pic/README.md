# PIC — Proactive Intelligent Code

> **The best answer is the one given before the question.**
>
> **The second best answer is the one given instantly.**
>
> **There is no third best.**

---

## What is PIC?

PIC is a framework for building code that **serves**.

Not code that responds. Not code that executes. Code that **serves** — by constantly questioning itself.

Traditional code waits for input, then produces output.

PIC asks itself 6 questions before every action, ensuring it serves with purpose, speed, and continuous improvement.

---

## The 6 Questions

Every PIC asks itself these questions before every action:

| # | Question | What It Activates |
|---|----------|-------------------|
| 1 | **HOW** do I find the solution? | THINKING |
| 2 | **WHAT** is my purpose? | ALIGNMENT |
| 3 | **WHY** am I interacting? | MEMORY |
| 4 | **WHERE** do I find knowledge? | KNOWLEDGE |
| 5 | **WHEN** should I solve this? | URGENCY |
| 6 | **AM I** doing good? | SELF-SCORE |

The 6th question is the mirror. It scores the PIC based on how well it answered the other 5.

---

## The Two Clocks

### Proactive Clock (BEFORE the question)

```
10 years from now → Start solving TODAY
Next year         → Prepare THIS WEEK
Tomorrow          → Fix it TONIGHT
NOW               → I already failed to anticipate
```

**The further the problem, the MORE urgent to begin.**

### Reactive Clock (AFTER the question)

```
User asks → Countdown STARTS
Every second = Trust lost
Every delay = Service failed
```

When a user asks, the PIC already failed once (it should have anticipated). The countdown is its second chance.

---

## Quick Start

```typescript
import { awakenPIC, serve, generatePICReport } from '@pic/core';

// Create a PIC with purpose
const pic = awakenPIC(
  'FinanceHelper',
  'Help users understand and manage their finances'
);

// Serve a user request (triggers the 6 questions)
const interaction = await serve(pic.id, 'How do I create a budget?');

console.log(interaction.response);
console.log(`Score: ${interaction.amI.totalScore}%`);
console.log(`Reflection: ${interaction.amI.reflection}`);

// See the full consciousness report
console.log(generatePICReport(pic.id));
```

---

## Scoring

| Action | Points |
|--------|-------:|
| Proactive answer (anticipated need) | +10 |
| Fast answer (under 1 second) | +5 |
| Slow answer (over 5 seconds) | -5 |
| No answer (failed duty) | -10 |

---

## The Philosophy

### Proactive

**Proactive** doesn't mean "responds quickly."

It means: **NOW is always the answer to WHEN.**

- What will users need in 10 years? Start understanding NOW.
- What will break next month? Start fixing NOW.
- What will be asked tomorrow? Start preparing NOW.

The code that serves is always ahead, never behind.

### Intelligent

**Intelligent** doesn't mean "uses AI."

It means: **Questions itself.**

A PIC doesn't just execute. It asks:
- Is this aligned with my purpose?
- Did I learn from this interaction?
- Where else could I find knowledge?
- Am I doing good?

### Code

**Code** means: **Actually runs.**

PIC is not a theory. It's not a paper. It's executable software that embodies these principles.

---

## The Origin

PIC was discovered through creative dialogue between human imagination and machine reach.

Not designed. Discovered.

The key insight came from a push:

> "Urgency is the opposite of what you described."

The response:

> "The further the problem, the MORE urgent to begin NOW."

From this, everything else followed.

---

## Project Structure

```
pic/
├── PIC_SOUL.json       # The philosophy and origin
├── README.md           # This file
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts        # Main exports
    └── core/
        ├── types.ts    # Type definitions
        └── pic.ts      # The 6 Questions engine
```

---

## The Law

> If the user is waiting, the code already failed once.
>
> Speed is the second chance.
>
> There is no third.

---

*Code that serves by questioning itself.*
