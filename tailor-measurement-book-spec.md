# Tailor's Measurement Book: Build Spec

For: No Hands: The Wispr Challenge (Track 2: No-Code or Track 1: Builders, your choice)
Deadline: Saturday 31 October, 11:59 pm IST
Goal: a working web app a tailor can use by speaking, that judges can open and try in one minute.

---

## 0. How to use this file (read first)

1. **Judges check how much of your writing went through Wispr Flow.** Pasting this finished file into Claude does not count as dictation. So: dictate your own first message in your own words (see Section 13, Stage 0), attach or paste this file only as a reference, and then dictate every stage prompt, correction and bug report with Flow.
2. This file is written for whichever builder you use (Claude, Lovable, Cursor, v0). Where it matters, it says what to do if there is no backend or no API key.
3. Build in stages (Section 13). Test after each stage. A smaller app that works beats a bigger app that breaks.
4. Wispr Flow runs on a Mac or Windows computer, not a phone. The tool is designed for a laptop on the shop counter. Say this honestly in your write-up.

---

## 1. One-paragraph pitch

Tailors take measurements with a tape in one hand and a pencil in the other, then write them in a paper register that gets messy, lost or misread. **Tailor's Measurement Book** lets the tailor just *say* the order while measuring: "Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500." The app turns that sentence into a clean customer card, shows it for confirmation, saves it, tracks due dates and balances, remembers repeat customers' old measurements, and drafts the "your order is ready" message.

---

## 2. User, problem, example

**User:** an independent tailor or a small tailoring shop (1 to 5 people) who takes 5 to 15 orders a day.

**Problems today**
- Measurements on scraps of paper or in a register; handwriting is unclear ("32 or 37?").
- No view of what is due this week, so deliveries slip.
- A regular customer returns after a year and the old measurements cannot be found.
- Customers call to ask "is it ready?" and the tailor must dig through the register.
- Balance and advance tracked in the head.

**Example day**
1. Saturday 10:00. Rohan walks in. The tailor measures and speaks the order. The app shows a card. She says "collar is 15, not 15 and a half" and the card updates. She confirms.
2. Saturday 10:05. The home screen shows "Due this week: 6 orders, 1 overdue".
3. Thursday. She says "ready Rohan". The order moves to Ready and a message is drafted: "Hello Rohan, your 2 shirts are ready for pickup at [Shop]. Balance: Rs 1,300."
4. Next year. Rohan returns. She says "Rohan's measurements" and sees the old card with "last measured 7 Nov 2026. Check for changes."

---

## 3. Design principles

1. **Speaking is the main input, typing always works too.** Judges may not have Flow. Everything must work by typing into the same box.
2. **Confirm before save.** A wrong number ruins a garment. The app never saves a parsed order silently.
3. **Never invent numbers.** If a measurement is unclear, leave it blank and highlight it.
4. **Big, readable, works at arm's length.** Large text, high contrast, large buttons. Counter use, not desk use.
5. **No login, no backend required.** Judges must open it without signing in. Data stays in the browser.
6. **Preloaded sample data** so the first screen is useful in seconds.

---

## 4. Scope

### MUST (build these first)
- A big **voice entry box** on the home screen, auto-focused, where dictated text lands.
- A **parser** that turns the sentence into a structured order (Section 5).
- A **confirmation card** showing every parsed field, with missing or unusual fields highlighted, editable by typing or by spoken correction.
- **Save order**, then show it in the orders list.
- **Due list** on the home screen: Overdue, Due today, Due tomorrow, This week.
- **Customer lookup** by name or phone, with measurement history.
- **Status change**: New, Cutting, Stitching, Ready, Delivered (by click and by voice).
- **Ready-for-pickup message** draft with a WhatsApp link and a copy button.
- **Sample data** and **sample dictation buttons**.

### SHOULD (if time allows)
- Spoken commands: "ready Rohan", "delivered Rohan", "what's due this week", "balance Rohan".
- Measurement **sanity warnings** (Section 8).
- **Changed since last time** comparison on repeat customers.
- **Print job slip** for the customer and a **cloth tag**.
- **Export CSV** of all orders.
- Units toggle (inches or cm).
- Undo last action.

### COULD (stretch)
- Hinglish keywords for fields (Section 5.4).
- Hinglish message templates.
- Family profiles (one phone number, several people).
- Daily summary: orders taken, money received, pending balance.
- Rush-period view that flags overbooked days.
- Reference photo attached to an order.
- Install as an app on the home screen (PWA) and offline use.
- Optional "smart mode" that uses an AI model for messy sentences (Section 10).

### ROADMAP (mention in the write-up, do not build)
- Phone microphone support, once voice keyboards are available on the tailor's phone.
- Automatic SMS or WhatsApp sending.
- Fabric stock and billing.
- Multi-shop accounts.

---

## 5. Spoken input specification

The tailor speaks free-form. Flow usually types numbers as digits ("38") but may also produce words ("thirty eight"), so handle both.

### 5.1 Fields to extract

| Field | Examples the tailor says | Notes |
|---|---|---|
| Customer name | "Rohan Mehta", "for Meera" | First capitalized words before a phone number or garment word |
| Phone | "98765 43210", "9876543210" | 10 digits, spaces allowed. Optional |
| Garment | shirt, trouser or pant(s), kurta, pyjama, blouse, salwar, suit, blazer, sherwani, lehenga, dress, waistcoat, jacket | One order can have more than one garment (see 5.5) |
| Quantity | "two shirts", "2 shirts" | Default 1 |
| Measurements | "chest 38", "waist thirty two", "collar 15 and a half" | See 5.2 and 5.3 |
| Fit | slim, regular, loose, comfortable, tight | Free text, stored as a tag |
| Delivery date | "next Friday", "tomorrow", "in 5 days", "7 November", "7th Nov", "15/11" | Resolve against today's date, shown clearly for confirmation |
| Price | "total 1800", "price 900 each", "stitching 1200" | Optional |
| Advance | "advance 500", "paid 500", "Rs 500 advance" | Optional, default 0 |
| Notes | "note: pocket on left", "remarks ..." | Also keep any leftover unmatched words here |

### 5.2 Measurement fields per garment

- **Shirt / kurta:** chest, waist, hip, shoulder, sleeve, length, collar (or neck), armhole, bicep, cuff (or wrist)
- **Trouser / pant / pyjama / salwar:** waist, hip, seat, thigh, knee, bottom (or mohri), length, inseam, rise
- **Blouse:** bust (or chest), waist, shoulder, sleeve, length, front length, back length, armhole, neck depth front, neck depth back
- **Suit / blazer / waistcoat / jacket / sherwani:** chest, waist, hip, shoulder, sleeve, length, neck
- **Dress / lehenga:** bust, waist, hip, length, shoulder, sleeve

Show only the relevant fields for the detected garment, but keep any extra measurement the tailor spoke.

### 5.3 Number handling

- Digits: 38, 32.5, 15 1/2
- Words: "thirty eight" to 38
- Halves and fractions: "fifteen and a half" to 15.5, "twenty four and a quarter" to 24.25, "seventeen and three quarters" to 17.75, "point five" to .5
- If the unit is not stated, use the shop default (inches). Allow "cm" in speech to switch that one value.

### 5.4 Field synonyms (include these so the parser is forgiving)

- chest: chest, bust, seena, chhati
- waist: waist, kamar
- shoulder: shoulder, shoulders, kandha
- sleeve: sleeve, sleeves, baju, aasteen
- length: length, lambai
- collar: collar, neck, gala
- hip: hip, hips, seat
- bottom: bottom, mohri

### 5.5 Multiple garments in one sentence

Example: "shirt chest 38 waist 32 sleeve 24, trouser waist 32 length 40, delivery Friday." Split on garment words. Each garment gets its own measurements, the same customer, and the same delivery date unless a different date is spoken.

### 5.6 Spoken corrections (while the confirmation card is open)

- "change collar to 15"
- "collar is 15, not 15 and a half"
- "make delivery Saturday"
- "advance 1000"
- "add note pocket on left"
- "remove the fit"
- "that's wrong, name is Rohan Mehra"

Apply the change to the card and re-render. If a correction is ambiguous, ask a one-line question instead of guessing.

### 5.7 Spoken commands (not new orders)

Detect these first, before treating text as a new order:

| Command | Action |
|---|---|
| "ready Rohan" / "Rohan is ready" | Set Rohan's latest open order to Ready, draft the pickup message |
| "delivered Rohan" | Set to Delivered |
| "Rohan's measurements" / "show Rohan" | Open the customer page |
| "what's due this week" / "due tomorrow" | Show the filtered list |
| "balance Rohan" | Show total, advance paid, balance |
| "paid 1000 Rohan" | Add 1000 to the advance and update the balance |
| "undo" | Revert the last change |

If a name matches several customers, show a short choice list.

---

## 6. Data model

Store in browser localStorage (wrap every read and write in try/catch, and make the app work with empty storage).

```
Customer
  id, name, phone (optional), createdAt, notes

Order
  id, customerId, createdAt, dueDate
  status: "new" | "cutting" | "stitching" | "ready" | "delivered"
  items: [ Item ]
  total (optional), advance (default 0)
  notes
  rawText   // the original spoken text, kept for reference and audit

Item
  garment, quantity, fit (optional)
  measurements: { chest, waist, hip, shoulder, sleeve, length, collar, ... }  // numbers in inches
  unit: "in" | "cm" // display unit

Measurement history is derived: all Items for a customer and garment type, newest first.
Balance = total - advance (only when total is known).
```

Keep the original spoken text on every order so a tailor can see what was said if a card looks wrong.

---

## 7. Screens and UX

### 7.1 Home
- Top: shop name, today's date.
- Center: a **very large voice entry box**, auto-focused, placeholder: "Hold your Flow key and say the order. Or type it."
- Below the box: three **sample dictation chips** ("Try: Rohan shirt order", "Try: ready Rohan", "Try: what's due this week") that fill the box so judges can test without Flow.
- Auto-parse about 1.2 seconds after the last keystroke or paste, or on Enter. Do not wait for a button.
- Below: the **due list** in four groups with counts: Overdue (red), Today, Tomorrow, This week. Each row: name, garments, due date, status chip, balance.

### 7.2 Confirmation card (opens after parsing)
- Shows every field in a clear grid, large numbers.
- Missing required fields (name, garment, delivery date) are highlighted in amber with "Add" prompts.
- Unusual measurements are marked with a warning icon and a one-line reason (Section 8).
- Each value is editable by clicking or typing, and by spoken correction in the same entry box.
- Buttons: **Save**, **Save and add another**, **Discard**.
- If the customer already exists (same phone or same name), show "Existing customer" and the **changed since last time** comparison.

### 7.3 Orders board
- Columns: New, Cutting, Stitching, Ready, Delivered.
- Click a card to move it or open it. Search and filter by name, phone, due date.

### 7.4 Customer page
- Name, phone, notes.
- **Latest measurements** per garment, with the date measured.
- **History** list of all past orders.
- Comparison view: "Chest 38 (was 37 on 12 Mar)".
- Button: new order for this customer (pre-fills the last measurements).

### 7.5 Messages
- Order-ready message, due-soon reminder, and balance-pending reminder.
- Each has **Open in WhatsApp** (a wa.me link with the text pre-filled, country code configurable, default 91) and **Copy**.
- Never claim a message was sent. The app only opens the message for the tailor to send.

### 7.6 Print
- **Job slip** for the customer: shop name, customer, items, delivery date, advance, balance.
- **Cloth tag**: short, large text (name, garment, due date) for attaching to fabric.
- Use print CSS so it prints cleanly from the browser.

### 7.7 Settings
- Shop name, default unit, default country code, language of messages.
- Button: **Reset to sample data**.
- Button: **Clear all data** with confirmation.

### 7.8 Accessibility and look
- Base font 18px or larger, large tap targets, strong contrast, works on a laptop screen at arm's length.
- Light and dark theme. Phone-width layout should not break (even though Flow is for desktop).
- Calm, uncluttered design. One primary action per screen.

---

## 8. Validation and sanity rules

Warn but never block. Flag with a one-line reason.

| Field | Typical inches | Flag if |
|---|---|---|
| chest / bust | 28 to 60 | outside range |
| waist | 24 to 55 | outside range |
| hip | 28 to 60 | outside range |
| shoulder | 12 to 24 | outside range |
| sleeve | 18 to 34 | outside range |
| shirt length | 24 to 36 | outside range |
| trouser length | 30 to 46 | outside range |
| collar / neck | 12 to 20 | outside range |

Additional checks:
- Possible unit mix-up: a value above about 70 in a field that is normally under 50 probably means centimeters.
- Relationship checks: sleeve larger than chest, or waist more than 15 inches above chest, gets a "please confirm" mark.
- Duplicate customer: same phone but different name gets a prompt, not a silent merge.
- Delivery date in the past gets a warning.
- Never fill in a missing measurement from a guess.

---

## 9. Message templates

English (default):
- Ready: "Hello {name}, your {items} {is/are} ready for pickup at {shop}. Balance to pay: Rs {balance}. Thank you."
- Reminder (day before due): "Hello {name}, a reminder that your {items} will be ready on {date} at {shop}."
- Balance: "Hello {name}, the balance for your order is Rs {balance}. Thank you, {shop}."

If total is unknown, leave out the balance sentence. Offer Hinglish versions as a stretch.

---

## 10. Technical constraints

- Build as a **static web app** (single HTML file, or React with Vite) that can be deployed to a public link. No login, no backend.
- Data in localStorage with try/catch around every access. The app must render correctly with empty storage.
- The **parser must be rule-based and run in the browser**, so the app works with no API key and no network. This is essential for the judging criterion "does it work".
- **Optional smart mode:** if the builder supports a secure server-side AI call (for example Lovable's built-in AI), add a toggle "Use smart parsing for messy sentences". Never put an API key in front-end code. If smart mode fails, fall back silently to the rule-based parser.
- Today's date comes from the browser clock. Show the resolved delivery date on the card so the tailor can verify "next Friday".
- Responsive layout, but optimized for a laptop.
- No analytics, no external trackers.

---

## 11. Sample data (preload)

Use made-up people. Never use real customers in the demo.

Customers and orders (dates relative to today so the due list always has content):
1. Rohan Mehta, 98765 43210. Shirt x2, slim. Chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15.5. Due in 6 days. Total 1800, advance 500. Status: stitching.
2. Meera Shah, 91234 56780. Blouse x3. Bust 34, waist 30, shoulder 14, sleeve 12, length 15. Due tomorrow. Total 1500, advance 1500. Status: ready.
3. Aman Verma. Trouser x1. Waist 34, hip 40, length 41, bottom 15. Due 2 days ago. Total 900, advance 0. Status: stitching (so there is an overdue example).
4. Kavita Desai, 99887 76655. Kurta x2. Chest 36, waist 34, hip 40, shoulder 14.5, sleeve 22, length 40. Due in 3 days. Status: cutting.
5. Rajesh Patel. Suit x1. Chest 42, waist 38, shoulder 18, sleeve 25, length 30. Due in 9 days. Total 7500, advance 2000. Status: new.
6. Rohan Mehta (second older order, 8 months ago). Shirt x1, chest 37. Status: delivered. (So "changed since last time" shows chest 37 to 38.)

---

## 12. Test sentences and expected results

Run these after the parser is built. Fix until all pass.

1. "Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500."
   Expect: name Rohan Mehta, phone 9876543210, shirt x2, slim, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15.5, due next Friday (resolved), advance 500.
2. "Meera blouse bust thirty four waist thirty shoulder fourteen delivery tomorrow."
   Expect: blouse, bust 34, waist 30, shoulder 14, due tomorrow, no phone, no price.
3. "Shirt chest 38 waist 32, trouser waist 32 length 40, for Aman, Saturday."
   Expect: two items under Aman, due Saturday.
4. "collar is 15 not 15 and a half" (with Rohan's card open).
   Expect: collar changes to 15.
5. "ready Rohan" (Rohan has an open order).
   Expect: status Ready, pickup message drafted.
6. "what's due this week"
   Expect: filtered list, no new order created.
7. "kurta chest 140" (typed or spoken).
   Expect: warning "looks like centimeters, confirm".
8. "Priya trouser waist 28" (no date).
   Expect: card opens with delivery date highlighted as missing.
9. Empty box and nonsense text ("hello test").
   Expect: friendly "I couldn't find an order or a command" message, nothing saved.
10. Two customers named Rohan and the command "ready Rohan".
    Expect: a choice list, no guess.

---

## 13. Voice build stages (dictate these with Flow)

Use one conversation with your builder. Dictate each stage in your own words, using the stage text below as a guide, and say what you see after each test.

**Stage 0: your opening message (dictate this yourself, about 1 to 2 minutes)**
Say the problem in your own words: who the tailor is, what goes wrong with the paper register, and what you want. Then say you will attach a reference spec file and that the builder should follow its scope and tests.

**Stage 1: app shell and sample data**
Ask for the home screen with the big voice entry box, the empty due list groups, settings with shop name, and the preloaded sample data from Section 11. Ask for large, readable styling. Test: the page opens with a populated due list.

**Stage 2: the parser**
Ask for the rule-based parser in Section 5 as a separate, testable module. Ask the builder to run the 10 test sentences in Section 12 and show a pass or fail table. Test: all 10 pass.

**Stage 3: confirmation card and save**
Ask for the confirmation card, missing-field highlights, editing by typing, spoken corrections, and saving into the orders list. Test: sentence 1 then the correction in sentence 4, then save.

**Stage 4: due list and orders board**
Ask for the grouped due list (Overdue, Today, Tomorrow, This week) and the status columns. Test: the overdue sample order shows in red.

**Stage 5: customers and history**
Ask for the customer page, measurement history, and the changed-since-last-time comparison. Test: Rohan shows chest 37 to 38.

**Stage 6: commands, messages and print**
Ask for spoken commands (Section 5.7), the three message templates with WhatsApp links and copy buttons, and the job slip and cloth tag print views. Test: "ready Rohan" drafts the message.

**Stage 7: validation and polish**
Ask for the sanity warnings in Section 8, undo, CSV export, unit toggle, and the sample dictation chips. Test: "kurta chest 140" shows the warning.

**Stage 8: final checks**
Ask the builder to review the app against the checklist in Section 16, fix issues, and give a public link. Test the link in a private browser window with no sign-in.

When something is wrong, dictate the bug exactly as you see it ("when I say X, the card shows Y, I expected Z").

---

## 14. Wispr Flow tips

- Dictate everything you can: prompts, bug reports, commit notes, your write-up. Use the keyboard only for shortcuts and tiny fixes.
- Try the **Snippets** feature in Flow for repeated phrases (for example your standard bug-report opening line, or a test sentence from Section 12).
- Speak numbers clearly and pause briefly between fields when you demo the voice entry.
- Check your usage card in Insights now and again, so you know your word count.
- Practice the demo sentence twice before recording. If Flow mishears a number, show the correction by voice, which actually demonstrates the feature.

---

## 15. Demo script (2 minutes maximum)

1. **0:00 to 0:15, the problem.** "Tailors write measurements in paper registers. Mistakes, lost slips, missed deliveries." Show a messy paper register image or a photo you made.
2. **0:15 to 0:50, speak an order.** Hold the Flow key and say the full sentence from Section 12. The card appears. Point out the highlighted missing field if there is one.
3. **0:50 to 1:10, voice correction.** Say "collar is 15, not 15 and a half." The card updates. Press Save.
4. **1:10 to 1:30, due list and ready message.** Show the due list with an overdue order. Say "ready Rohan" and show the drafted message and the WhatsApp link.
5. **1:30 to 1:50, repeat customer.** Open Rohan's page and show "chest 37 to 38, check for changes."
6. **1:50 to 2:00, close.** Show the usage card and say how many words you dictated while building. State the limit: runs on a laptop with Flow.

Keep it under 2 minutes. Blur any real phone numbers or names.

---

## 16. Submission checklist

Before 11:59 pm IST, 31 October (aim to submit by 11:00 pm):

- [ ] Public link opens without login, in a private window.
- [ ] Sample data and sample dictation chips are visible on the first screen.
- [ ] All 10 test sentences pass.
- [ ] Demo video of 2 minutes or less, uploaded (unlisted is fine).
- [ ] Wispr usage card screenshot from Insights in the desktop app.
- [ ] Short write-up (draft below).
- [ ] Track chosen: No-Code or Builders (one only).
- [ ] No real customer data anywhere in the app or video.

**Write-up draft (edit in your own words, dictate it)**
- Problem: "Independent tailors record measurements by hand in registers, which causes unreadable numbers, lost slips, and missed deliveries."
- Who it is for: "Small tailoring shops taking 5 to 15 orders a day."
- How Wispr was used: "I built the app by dictating every prompt and fix to my builder with Wispr Flow. The app itself is designed around dictation: the tailor says the order and the card fills in."
- Honest limit: "It runs on a laptop where Flow is installed. Measurements are always confirmed by the tailor before saving."

---

## 17. Risks and honest limits

- **Wrong measurement ruins a garment.** Confirm-before-save is mandatory. Never auto-save.
- **Flow is desktop only.** A tailor who has only a phone cannot use the voice input yet. Say this plainly.
- **Dates like "next Friday" can be read two ways.** Always show the resolved calendar date on the card.
- **Names can be misheard.** Allow quick editing and show existing-customer matches.
- **Rule-based parsing has limits.** Unusual phrasing may fail. That is why the card always shows what was understood, and the original text is kept.
- **Browser storage can be empty or cleared.** The app must work with no stored data, and the reset button restores the sample data.
- **Time.** If time runs short, finish MUST items and the demo. Skip COULD items entirely.
