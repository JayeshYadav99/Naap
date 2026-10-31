# Naap

**The tailor's voice measurement book.** *Naap* (नाप) is Hindi for "measurement".

Tailors measure with a tape in one hand and write in a paper register that gets messy, lost or misread ("32 or 37?"). With Naap the tailor just **says the order while measuring**, in English, Hindi or Hinglish:

> "Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500."

Naap turns that into a clean customer card to confirm, then tracks delivery dates and balances, remembers every customer's measurements, and drafts the "your order is ready" WhatsApp message.

Built by voice with [Wispr Flow](https://wisprflow.ai) for **No Hands: The Wispr Challenge**.

---

## How it works

```
Tailor speaks ──► Wispr Flow (or the built-in mic, or typing) ──► text in the box
              ──► Naap parser ──► confirmation card ──► tailor checks and saves ──► due list, customer history, WhatsApp
```

1. **Speak.** Hold the Wispr Flow key and say the order. Flow types it into Naap's big entry box. The browser microphone button and plain typing work too.
2. **Check.** Naap's rule-based parser turns the sentence into a card: customer, garments, every measurement, delivery date, money. Missing fields show in amber, unusual values in red ("chest 140 looks like centimetres"). Naap never guesses a number.
3. **Fix by voice.** "collar is 15, not 15 and a half", "make delivery Saturday", "advance 1000".
4. **Save.** The order gets a number (#47), joins the due list, and the customer's measurements are kept for next time.

## Features

**Orders**
- Free-form spoken orders: name, phone, 13 garment types, quantities, fit, measurements (fractions, number words, cm), delivery date ("next Friday", "parso", "7 Nov", "15/11"), total, price each, advance, notes
- Several garments in one sentence ("shirt chest 38, trouser waist 32 length 40")
- Trial / fitting dates, fabric status (given / still to come / shop's), alteration jobs ("pant shorten 1 inch, 50 rupees, kal"), style details
- Confirmation card with a plain-language summary that can be **read aloud**, a **2D garment diagram** with each measurement drawn on it, and "was 37 last time" for repeat customers
- Edit saved orders, repeat an order from last measurements

**Daily work, by voice or tap**
- Due list: Overdue (red), Today, Tomorrow, This week, Later, with balance to collect
- Orders board: New → Cutting → Stitching → Ready → Delivered
- Commands: “ready Rohan”, “ready 47”, “ready Rohan kurta”, “delivered Meera”, “balance Rajesh”, “paid 500 Meera”, “today’s summary”, “what’s due this week”, “Rohan’s measurements”, “undo”
- Asks instead of guessing: two customers named Rohan, or two open orders → a choice list

**Customers and money**
- Customer page with measurements compared to last time (chest 37 → 38), order history, payments, notes
- Today’s summary: orders taken, money received, balance to collect, reminders for tomorrow

**Messages and print**
- Ready / reminder / balance messages in English, Hindi or Hinglish, opened in WhatsApp (never sent automatically) or copied
- Job slip and cloth tag with order number, print-ready

**Languages and accessibility**
- Every screen in **English and हिन्दी**, including the landing page, messages and help. More languages are one dictionary file each (`app/src/i18n/`).
- Understands Hinglish in Latin letters (“seena chautis kamar battis”) and Hindi in Devanagari (“सीना ३८, गला साढ़े पंद्रह”)
- 18 px+ text in Atkinson Hyperlegible, 48 px+ tap targets, light and dark themes, full keyboard and screen-reader support, phone and laptop layouts

**Accounts and data**
- Shop accounts (mobile number + password) with data in **Neon Postgres**, so the same orders open on the shop phone and laptop
- **Demo shop** with sample orders, no sign-up needed (saved in the browser only)
- Saves in the background with a visible “Saving… / Saved” badge; works offline and syncs when back online
- Backup / restore file and CSV export

## Tech stack

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Landing page | Server-rendered, in the visitor’s saved language |
| Shop app (`/app`) | Client-rendered (uses the browser clock, mic and local cache) |
| Parser | Rule-based TypeScript, runs in the browser, no AI or API key (`app/src/parser/`) |
| Database | Neon Postgres via `pg`, through Next.js API routes (`app/src/server/`, `app/src/app/api/`) |
| Auth | scrypt password hashes, signed HTTP-only session cookie, lockout after 5 wrong tries |
| Speech | Wispr Flow (primary); Web Speech API mic button as a fallback (Chrome, Edge, Android Chrome) |
| Tests | Vitest: 49 parser tests including the spec’s 10 test sentences |

## Run it locally

```bash
cd app
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                   # http://localhost:3000  (landing)  ·  /app  (shop counter)
npm test                      # parser tests
```

`.env.local` needs:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (`…-pooler…neon.tech/neondb?sslmode=require`) |
| `AUTH_SECRET` | Random string, at least 32 characters, used to sign login cookies. Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

The database tables are created automatically on first use. Without a database, the **demo shop** still works.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `app`.
3. Add the environment variables `DATABASE_URL` and `AUTH_SECRET`.
4. Deploy. The landing page is at `/`, the shop app at `/app`, and judges can tap **Try the demo shop** without an account.

## Project structure

```
app/
  src/app/            landing page, /app route, API routes (auth, data, sync), global styles
  src/components/     shop screens: Today, confirmation card, due list, board, customers, settings, help, print
  src/parser/         speech-to-order parser: numbers, dates, vocabulary, orders, corrections, commands, validation
  src/i18n/           English and Hindi dictionaries, language switcher
  src/store/          data loading, background sync, undo, sample shop
  src/server/         database, auth, data access (server only)
docs/
  HOW-TO-TEST.md      step-by-step manual test script
  TEST-SCENARIOS.md   test scenarios with who runs each and current status
mockup/               first clickable UI mockup
tailor-measurement-book-spec.md   original build spec
```

## Honest limits

- Speech-to-text comes from Wispr Flow or the browser; Naap reads the text. The browser mic sends audio to the browser maker (Google in Chrome) for recognition; Wispr Flow and typing do not go through the browser.
- Rule-based parsing can miss unusual phrasing. That is why the card always shows what was understood, keeps the original sentence, and nothing is saved until the tailor confirms.
- WhatsApp messages are opened for the tailor to send; Naap never sends them by itself.
- Sample customers in the demo are made up.
