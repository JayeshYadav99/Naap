# Naap: Test Scenarios

Real shop situations to check before the demo and submission.

**Who runs each test**

| Tag | Meaning |
|---|---|
| **AUTO** | Automated unit test in `app/src/parser/parser.test.ts`. Run with `cd app && npm test`. |
| **BROWSER** | Clicked through by Claude in a headless browser at laptop width (1366 px, light theme) and phone width (390 px, dark theme). |
| **YOU** | Needs a person: Wispr Flow dictation, a real phone, a printer, WhatsApp, a screen reader, or real tailor data. |

**Status** is what has actually been run so far: ✅ passed · ⬜ not run yet.

Sample shop: Sharma Tailors. Today in the examples: Saturday 31 October 2026. Order numbers start at #41.

---

## 1. Taking a new order

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| O-01 | Full order in one breath (spec test 1) | Say: “Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500.” | Card: Rohan Mehta, 9876543210, 2 slim shirts, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15½, delivery Fri 6 Nov, advance 500, nothing unmatched | AUTO, BROWSER | ✅ |
| O-02 | Number words (spec test 2) | “Meera blouse bust thirty four waist thirty shoulder fourteen delivery tomorrow.” | Blouse, bust 34, waist 30, shoulder 14, due tomorrow, no phone, no price | AUTO | ✅ |
| O-03 | Two garments, name at the end (spec test 3) | “Shirt chest 38 waist 32, trouser waist 32 length 40, for Aman, Saturday.” | Two items under Aman: shirt (38/32) and trouser (32/40), due Sat 7 Nov | AUTO | ✅ |
| O-04 | No date (spec test 8) | “Priya trouser waist 28” | Card opens, delivery date in amber “missing”; Save blocked with a clear message | AUTO | ✅ |
| O-05 | Nonsense (spec test 9) | “hello test”, then an empty box | “I couldn't find an order or a command…”, nothing saved | AUTO | ✅ |
| O-06 | Fractions | “Shirt sleeve twenty four and a quarter, shoulder seventeen and three quarters, collar 15 1/2, chest 38 point five” | 24¼, 17¾, 15½, 38.5 | AUTO | ✅ |
| O-07 | Hinglish | “Pooja kurta seena chautis kamar battis lambai byalis, aasteen saadhe bees, parso” | Kurta: chest 34, waist 32, length 42, sleeve 20½; due Mon 2 Nov | AUTO | ✅ |
| O-08 | Hindi quantity | “Sunil do kurta chest 40” | 2 kurtas | AUTO | ✅ |
| O-09 | Dates | “7 November”, “7th Nov”, “15/11”, “in 5 days”, “next week” | 7 Nov, 7 Nov, 15 Nov, 5 Nov, 7 Nov | AUTO | ✅ |
| O-10 | Money | “Ravi 2 shirts chest 40, price 900 each, Rs 500 advance” | Total 1800, advance 500, balance 1300 | AUTO | ✅ |
| O-11 | One value in cm | “shirt chest 97 cm waist 32” | Chest ≈ 38.2 in (noted “said in cm”), waist 32 | AUTO | ✅ |
| O-12 | Measurement with no number | “Rohan shirt chest 38 collar” | Collar blank and flagged; never guessed | AUTO | ✅ |
| O-13 | Note | “Rohan shirt chest 38, note: pocket on left” | Notes: “pocket on left” | AUTO | ✅ |
| O-14 | Trial + delivery | “Imran sherwani chest 40, trial Tuesday, delivery 14 Nov” | Trial Tue 3 Nov, delivery 14 Nov | AUTO | ✅ |
| O-15 | Fabric | “…own fabric…” / “…cloth later…” / “…shop fabric…” | Received / still to come / shop | AUTO | ✅ |
| O-16 | Alteration job | “Ravi pant shorten 1 inch, 50 rupees, kal” | Alteration, trouser, work “shorten 1 inch”, total 50, due tomorrow | AUTO | ✅ |
| O-17 | Repeat customer | Speak O-01 when Rohan exists | “Existing customer” badge, “Last measured …”, saves under the same customer | BROWSER | ✅ |
| O-18 | Save | Press **Save order** | Toast “Saved #51 …” with Undo; order appears in due list and board | BROWSER | ✅ |
| O-19 | Save and add another | Press **Save and add another** | Card closes, box focused, ready for the next customer | YOU | ⬜ |
| O-20 | Same phone, different name | Order for “Rahul”, phone 98765 43210 | Card asks “This phone belongs to Rohan Mehta. Same person?” with Yes / No buttons | YOU | ⬜ |
| O-21 | New order from last measurements | Customer page, **New order with last measurements** | Card pre-filled from the last order, asks for the date | YOU | ⬜ |

## 2. Fixing the open card

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| C-01 | Spoken correction (spec test 4) | With O-01 open: “collar is 15, not 15 and a half” | Collar 15½ → 15, green “changed” note, other values untouched | AUTO, BROWSER | ✅ |
| C-02 | Change to | “change collar to 15” | Collar 15 | AUTO | ✅ |
| C-03 | Date | “make delivery Saturday” | Delivery Sat 7 Nov | AUTO, BROWSER | ✅ |
| C-04 | Money | “advance 1000” | Advance 1000 | AUTO | ✅ |
| C-05 | Note | “add note pocket on left” | Note added | AUTO | ✅ |
| C-06 | Remove | “remove the fit” | Fit cleared | AUTO | ✅ |
| C-07 | Name | “that's wrong, name is Rohan Mehra” | Name changed | AUTO | ✅ |
| C-08 | Ambiguous | Two garments open, say “waist 34” | Asks “Which one: shirt or trouser?” and changes nothing | AUTO | ✅ |
| C-09 | Type to fix | Click a box, type 15 1/2, press Tab | Shows 15½ | YOU | ⬜ |
| C-10 | Add a hidden field | Click **+ Hip**, type 40 | Hip box appears and is focused | YOU | ⬜ |
| C-11 | Diagram | Click **Show on diagram** | Garment outline with each value drawn on it; missing ones as “?” | BROWSER | ✅ |
| C-12 | Read aloud | Click **Read it aloud** | Browser reads the summary sentence; button changes to Stop | YOU | ⬜ |
| C-13 | Discard | Click **Discard** | Card closes, “Discarded. Nothing was saved.” | YOU | ⬜ |

## 3. Daily work and commands

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| D-01 | Overdue shows red | Open Today | Aman Verma (#…) under Overdue in red, “2 days late” | BROWSER | ✅ |
| D-02 | Due filter (spec test 6) | “what's due this week” | List filtered, “No order was created” | AUTO, BROWSER | ✅ |
| D-03 | Ready by name (spec test 5) | “ready Rohan” (one open order) | Status Ready, WhatsApp message drafted with balance | AUTO, BROWSER | ✅ |
| D-04 | Ready with several open orders | Save O-01, then “ready Rohan” | “Rohan Mehta has 2 open orders. Which one?” with #numbers | BROWSER | ✅ |
| D-05 | Ready by number | “ready 47” | That order moves to Ready | AUTO | ✅ |
| D-06 | Ready by garment | “ready Rohan kurta” | Picks Rohan's kurta order | AUTO | ✅ |
| D-07 | Delivered order protected | “ready 41” (a delivered order) | Warns “already delivered”, changes nothing | YOU | ⬜ |
| D-08 | Two customers, same name (spec test 10) | Add “Rohan Kapoor”, say “ready Rohan” | Choice list of both Rohans, no guess | AUTO | ✅ |
| D-09 | Unknown name | “ready Suresh” | “No customer called ‘suresh’” | YOU | ⬜ |
| D-10 | Balance | “balance Rajesh” | Total 7500, paid 2000, balance 5500 | YOU | ⬜ |
| D-11 | Payment | “paid 1000 Rohan” | Balance drops by 1000; shows in today's summary | AUTO (parse), YOU (screen) | ⬜ |
| D-12 | Today's summary | “today's summary” or “aaj ka hisaab” | Orders taken, money received, delivered, balance, reminders for tomorrow | AUTO, BROWSER | ✅ |
| D-13 | Board moves | Orders screen, **Cutting →** on a card | Card moves; toast with Undo | YOU | ⬜ |
| D-14 | Board search by number | Type “47” in search | Only order #47 | YOU | ⬜ |
| D-15 | Undo | After any change say “undo” or press Ctrl+Z | Last change reversed | YOU | ⬜ |
| D-16 | Help | Say “help” or tap **?** | Help page with what to say and common questions | BROWSER | ✅ |

## 4. Customers and editing

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| U-01 | Changed since last time | Open Rohan | Shirt: chest 38, before 37 (+1), date of each | BROWSER | ✅ |
| U-02 | Edit a saved order | Customer page → **Edit order** → “make delivery Saturday” → **Save changes** | Same order number, new date, back on the customer page | BROWSER | ✅ |
| U-03 | Edit name or phone | **Edit name or phone**, change, Save | Updated everywhere; duplicate phone blocked | YOU | ⬜ |
| U-04 | Delete order / customer | **Delete** → **Yes, delete** | Removed; Undo brings it back | YOU | ⬜ |
| U-05 | Fabric arrives later | Order with “Fabric still to come” → **Mark received** | Red “Fabric not received” badge disappears from the board | YOU | ⬜ |
| U-06 | Search | Customers screen: type “9988” | Kavita Desai | YOU | ⬜ |

## 5. Messages and printing

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| M-01 | WhatsApp opens | After D-03, **Open in WhatsApp** on a phone with WhatsApp | Chat with the customer's number, message filled in, nothing sent automatically | YOU | ⬜ |
| M-02 | Copy | **Copy message** | “Message copied”; pastes correctly | YOU | ⬜ |
| M-03 | Hinglish messages | Settings → Hinglish, then D-03 | “Namaste Rohan ji, aapke 2 shirts (order #…) taiyar hain…” | YOU | ⬜ |
| M-04 | Reminder for tomorrow | Today's summary → **Send reminder** | WhatsApp opens with the reminder | YOU | ⬜ |
| M-05 | Job slip | Customer page → **Job slip** → **Print** | One clean page: shop, order #, customer, items, style, dates, money | YOU | ⬜ |
| M-06 | Cloth tag | **Cloth tag** → **Print** | Big #number, name, items, due date | YOU | ⬜ |

## 6. Safety and validation

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| V-01 | Centimetre mix-up (spec test 7) | “kurta chest 140” | Red box: “Looks like centimetres (140 cm ≈ 55 in). Please confirm.” Save still allowed once name and date are added | AUTO, BROWSER | ✅ |
| V-02 | Unusual size | “shirt chest 20” | “Smaller than usual …” warning | YOU | ⬜ |
| V-03 | Sleeve longer than chest | “shirt chest 30 sleeve 34” | “please confirm” mark | YOU | ⬜ |
| V-04 | Date in the past | Pick yesterday in the date box | “This date is in the past.” | YOU | ⬜ |
| V-05 | Nothing saved silently | Speak any order, close the tab without saving | Order not in the due list after reopening | YOU | ⬜ |

## 7. Data, settings, backup

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| S-01 | Data survives reload | Save an order, refresh | Still there (demo: browser; shop: Neon) | YOU (demo), BROWSER (shop) | ✅ shop |
| S-02 | Backup and restore | Settings → **Download backup** → **Clear all data** → **Restore from backup** | Everything back | YOU | ⬜ |
| S-03 | Wrong backup file | Restore any other JSON file | “That file could not be read as a Naap backup.” Nothing changed | YOU | ⬜ |
| S-04 | CSV export | **Export orders as CSV**, open in Excel or Sheets | One row per garment, with order # and measurements | YOU | ⬜ |
| S-05 | Units | Settings → Centimetres | Boxes show cm; speech without a unit is read as cm | YOU | ⬜ |
| S-06 | Reset | **Reset to sample data** → confirm | Sample shop back | YOU | ⬜ |
| S-07 | Private window | Open the app in a private window | Opens with sample data, no sign-in | YOU | ⬜ |

## 8. Devices, voice and accessibility

| ID | Scenario | Steps | Expected | Who | Status |
|---|---|---|---|---|---|
| A-01 | Real Wispr Flow on laptop | Hold the Flow key in the box and say O-01 | Text lands in the box; card opens about 1 s after you stop | YOU | ⬜ |
| A-02 | Flow keyboard on phone | Android/iOS Flow keyboard in the box | Same as A-01 | YOU | ⬜ |
| A-03 | Flow in Hinglish mode | Flow language set to Hinglish, say O-07 | Hindi numbers recognised | YOU | ⬜ |
| A-04 | Phone layout | 390 px wide | Bottom tab bar, no sideways scrolling, Save buttons reachable | BROWSER | ✅ |
| A-05 | Dark theme | System dark mode or the moon button | Readable everywhere | BROWSER | ✅ |
| A-06 | Keyboard only | Tab through Today, card, Save | Visible focus ring everywhere; everything reachable | YOU | ⬜ |
| A-07 | Screen reader | VoiceOver / NVDA / TalkBack | Card changes and messages are announced | YOU | ⬜ |
| A-08 | Arm's length | Laptop on a counter, read from 1 m | Numbers readable | YOU | ⬜ |
| A-09 | Real register | Type or say 10–15 real orders (names changed) | Note how many parse right first time; this goes in the write-up | YOU | ⬜ |

## 9. Shop accounts and the Neon database

Data for signed-in shops is stored in Neon Postgres (tables: `shops`, `customers`, `orders`). The demo shop stays in the browser.

| ID | Scenario | Expected | Who | Status |
|---|---|---|---|---|
| N-01 | Create a shop (shop name, mobile, password) | Signed in, lands on Today, header shows the shop name | BROWSER | ✅ |
| N-02 | Same mobile signs up again | “This mobile number already has a shop. Sign in instead.” | API test | ✅ |
| N-03 | Save an order, wait for “Saved”, reload | Order still there (loaded from Neon) | BROWSER | ✅ |
| N-04 | Sign out, then sign in again | Same orders come back | BROWSER | ✅ |
| N-05 | Wrong password | “Mobile number or password is wrong.” | BROWSER | ✅ |
| N-06 | 5 wrong passwords | Locked for 10 minutes, even with the right password | API test | ✅ |
| N-07 | Two shops | Shop B sees none of shop A's customers or orders | API test | ✅ |
| N-08 | No cookie / forged cookie | 401, no data | API test | ✅ |
| N-09 | Invalid data sent to the server | Rejected (“Invalid order”), nothing written | API test | ✅ |
| N-10 | Demo without an account | “Try the demo shop” works with no sign-in, yellow demo bar shown | BROWSER | ✅ |
| N-11 | Second device | Sign in on your phone: same orders as the laptop | YOU | ⬜ |
| N-12 | Internet drops while saving | Header shows “Offline: will save when back online”; saves when back | YOU | ⬜ |
| N-13 | Edit on one device, reload the other | Change appears after reload | YOU | ⬜ |

## 10. Languages and the microphone

| ID | Scenario | Expected | Who | Status |
|---|---|---|---|---|
| L-01 | Landing page → **हिन्दी** | Whole landing page in Hindi; choice remembered on reload | BROWSER | ✅ |
| L-02 | App header **हि / EN** | Every screen switches: nav, card, due list, board, customers, settings, help, print | BROWSER | ✅ |
| L-03 | Hindi sample “Rohan का शर्ट ऑर्डर” | Card in Hindi; summary “Rohan Mehta का ऑर्डर। 2 … शर्ट: सीना 38 …” | BROWSER | ✅ |
| L-04 | Hindi correction “गला 15” | “✓ गला 15½ → 15” | AUTO, BROWSER | ✅ |
| L-05 | Devanagari order “रोहन शर्ट सीना ३८ कमर 32 गला साढ़े पंद्रह, दो शर्ट, शुक्रवार डिलीवरी, एडवांस 500” | Name रोहन, 2 shirts, chest 38, waist 32, collar 15½, Friday, advance 500 | AUTO | ✅ |
| L-06 | “Meera का ऑर्डर तैयार है” in Hindi mode | WhatsApp message in Hindi: “नमस्ते Meera जी, आपके 3 ब्लाउज़ (ऑर्डर #45) तैयार हैं…” | BROWSER | ✅ |
| L-07 | “कुर्ता सीना 140” | Red warning in Hindi: “यह सेंटीमीटर लगता है…” | BROWSER | ✅ |
| L-08 | Settings → Customer message language → Hinglish | Messages in Hinglish even with Hindi screens | YOU | ⬜ |
| M-10 | Mic button visible | Shown in Chrome/Edge/Android Chrome; hidden where unsupported | BROWSER | ✅ (shown) |
| M-11 | Tap mic, speak an order in English | Words appear live; stops ~2.5 s after you stop; card opens | YOU | ⬜ |
| M-12 | Switch to हिन्दी, tap mic, speak in Hindi | Hindi text appears (Devanagari); card fills correctly | YOU | ⬜ |
| M-13 | Block the mic permission | Clear message to allow it or use Flow/typing | YOU | ⬜ |
| M-14 | Read it aloud in Hindi | Summary read in a Hindi voice (if the device has one) | YOU | ⬜ |

---

### Before submitting, at minimum test
A-01, O-01 + C-01 + O-18, D-03 + M-01, U-01, V-01, S-07, A-04, M-05, N-11, M-11, M-12.
