# How to test Naap

A step-by-step script you can follow with the app open. Each flow builds on the one before it, so do them in order in **one shop account**. It takes about 30–40 minutes for flows 1–10.

For every step: say or type exactly what's in **Say**, check what you see against **Expect**, and tick the box. If something doesn't match, note the flow number, step number, what you said and what you saw. That's all I need to fix it.

---

## Before you start

1. The app is running at **http://localhost:3000**. In the Codespace, open the **Ports** tab in VS Code and click the globe icon on port 3000 if localhost doesn't open.
2. Open **Wispr Flow** on your laptop. Language: English. Hinglish is used only in flow 9.
3. Use a normal browser window (not private) for flows 1–10.
4. Have your phone nearby for flows 11 and 12.
5. **Close `app/.env.local`** in the editor so your database password isn't on screen.

**How to speak into Naap:** click in the big box under "Say the order", hold your Flow key, speak, and release. Naap reads the text about 1 second after it lands. You can also press Enter to read it at once.

---

## Flow 1: Create your shop account

| # | Do | Expect | ✓ |
|---|---|---|---|
| 1.1 | Open http://localhost:3000 | Landing page with the headline “Measure with both hands. Say the order.” | ☐ |
| 1.2 | Click **Sign in** (top right) | “Sign in to your shop” screen | ☐ |
| 1.3 | Click **New shop** | Title changes to “Create your shop”; a “Shop name” box appears | ☐ |
| 1.4 | Click **Create shop** with everything empty | Red message: “Enter your shop name.” | ☐ |
| 1.5 | Shop name `Test Tailors`, mobile `12345`, password `abc` → **Create shop** | “Enter a 10-digit mobile number.” | ☐ |
| 1.6 | Mobile `98111 22233`, password `abc` → **Create shop** | “Password must be at least 6 characters.” | ☐ |
| 1.7 | Password `tailor123` → **Create shop** | You land on **Today**; the header shows “Test Tailors” and a green **Saved** badge | ☐ |
| 1.8 | Look at the due list on the right (below on a phone) | All groups say “Nothing here.” A new shop starts empty | ☐ |

---

## Flow 2: Take an order by voice

| # | Do | Expect | ✓ |
|---|---|---|---|
| 2.1 | **Say:** “Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, length 29, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500.” | Text appears in the box, then a **Check this order** card opens about 1 second after you stop | ☐ |
| 2.2 | Read the grey summary at the top of the card | “Order for Rohan Mehta. 2 slim fit shirts: Chest 38, Waist 32, Shoulder 17, Sleeve 24, Length 29, Collar 15½. Delivery Friday, … Advance Rs 500, total not set.” | ☐ |
| 2.3 | Check each box | Name Rohan Mehta · Phone 98765 43210 · Shirt · Quantity 2 · Fit slim · Chest 38 · Waist 32 · Shoulder 17 · Sleeve 24 · Length 29 · Collar 15½ | ☐ |
| 2.4 | Check the delivery date | Shows the date of the coming Friday, plus “in N days · you said ‘next Friday’” | ☐ |
| 2.5 | Look below the measurements | Small dashed buttons: **+ Hip**, **+ Armhole**, **+ Bicep**, **+ Cuff** (fields you didn't say) | ☐ |
| 2.6 | Click **Read it aloud** | The browser reads the summary out loud; the button changes to “Stop reading” | ☐ |
| 2.7 | Click **Show on diagram** | A shirt outline appears with Chest 38, Collar 15½ and so on drawn on it, and “?” for missing ones | ☐ |
| 2.8 | Check the “Not understood” line | It should **not** appear. If it does, note which words it lists | ☐ |

If Flow writes numbers as words (“thirty eight”), that's fine; Naap reads both.

---

## Flow 3: Fix the card by voice

Keep the card from flow 2 open.

| # | Do | Expect | ✓ |
|---|---|---|---|
| 3.1 | Note the sample buttons under the box | They now read “collar is 15, not 15½”, “make delivery Saturday” and others | ☐ |
| 3.2 | **Say:** “collar is 15, not 15 and a half” | Green line “✓ Collar 15½ → 15”; the collar box flashes green and shows 15; other numbers unchanged | ☐ |
| 3.3 | **Say:** “total 1800” | “✓ Total set to Rs 1800”; Balance box shows Rs 1,300 | ☐ |
| 3.4 | **Say:** “add note pocket on left” | Notes box shows “pocket on left” | ☐ |
| 3.5 | Click **+ Cuff**, type `9`, press Tab | A Cuff box appears with 9 | ☐ |
| 3.6 | In **Style details** type `button-down` | Suggestions appear (button-down collar, one pocket…); pick one | ☐ |
| 3.7 | Under **Fabric** click **Customer gave fabric** and type `white cotton 2.5 m` | Button turns dark (selected); detail saved in the box | ☐ |
| 3.8 | Click **Save order** | Card closes; toast “Saved #1: Rohan Mehta, 2 shirts, due …” with an **Undo** button; header badge goes **Saving… → Saved** | ☐ |
| 3.9 | Look at the due list | Rohan Mehta under “This week” (or Today/Tomorrow, depending on the date), with “#1”, status **New**, “Due Rs 1,300” in red | ☐ |

---

## Flow 4: Safety checks

| # | Do | Expect | ✓ |
|---|---|---|---|
| 4.1 | **Say:** “kurta chest 140” | Card opens. Chest box is red: “Looks like centimetres (140 cm ≈ 55 in). Please confirm.” Name and delivery date are amber “missing” | ☐ |
| 4.2 | Click **Save order** | Not saved. Toast “Add the customer name.” and the cursor jumps to the Name box | ☐ |
| 4.3 | Click **Discard** | Card closes; “Discarded. Nothing was saved.” | ☐ |
| 4.4 | **Say:** “hello test” | Grey message: “I couldn't find an order or a command in that…” | ☐ |
| 4.5 | **Say:** “Priya trouser waist 28” | Card opens; delivery date amber “Add a delivery date. Say ‘delivery Saturday’.” | ☐ |
| 4.6 | **Say:** “delivery tomorrow” | “✓ Delivery … ” and the amber goes away; tomorrow's date is shown | ☐ |
| 4.7 | **Save order** | Saved as #2; Priya appears under “Due tomorrow” | ☐ |

---

## Flow 5: More orders (to have something to work with)

| # | Do | Expect | ✓ |
|---|---|---|---|
| 5.1 | **Say:** “Shirt chest 38 waist 32, trouser waist 32 length 40, for Aman, Saturday.” | One card with **two garments**: shirt (chest 38, waist 32) and trouser (waist 32, length 40); name Aman; delivery Saturday | ☐ |
| 5.2 | **Say:** “waist 34” | Amber question: “Which one: shirt or trouser? …” Nothing changed | ☐ |
| 5.3 | **Say:** “trouser waist 34” | “✓ Waist 32 → 34” on the trouser only | ☐ |
| 5.4 | **Save order** | Saved as #3 | ☐ |
| 5.5 | **Say:** “Imran sherwani chest 40 waist 36 shoulder 18, trial Tuesday, delivery 14 November, total 12000, advance 5000” | Card: trial date = coming Tuesday, delivery 14 Nov, total 12,000, advance 5,000, balance 7,000 | ☐ |
| 5.6 | **Save order** | Saved as #4; due list row shows “· trial …” | ☐ |
| 5.7 | **Say:** “Ravi pant shorten 1 inch, 50 rupees, tomorrow” | Card shows an orange **Alteration** badge; “Alteration / repair” selected; “What to alter: shorten 1 inch”; total 50 | ☐ |
| 5.8 | Type phone `9811144455` in the card, then **Save order** | Saved as #5 | ☐ |

---

## Flow 6: Daily work by voice

| # | Do | Expect | ✓ |
|---|---|---|---|
| 6.1 | **Say:** “what's due this week” | Blue message “Showing orders due this week. No order was created.”; the due list filter switches to **This week** | ☐ |
| 6.2 | Click **All** in the due list filter | All groups show again | ☐ |
| 6.3 | **Say:** “cutting Rohan” | “#1 Rohan Mehta's 2 shirts moved to Cutting.” Due list chip shows **Cutting** | ☐ |
| 6.4 | **Say:** “undo” | “Undone: …”; Rohan back to **New** | ☐ |
| 6.5 | **Say:** “ready Rohan” | Green panel “#1 Rohan Mehta: 2 shirts ready” with the message “Hello Rohan, your 2 shirts (order #1) are ready for pickup at Test Tailors. Balance to pay: Rs 1,300. Thank you.” | ☐ |
| 6.6 | Click **Copy message** | Toast “Message copied”; paste it somewhere to check | ☐ |
| 6.7 | Click **Open in WhatsApp** | WhatsApp (web or app) opens a chat with +91 98765 43210 and the message filled in. **Don't send it** (it's a made-up number) | ☐ |
| 6.8 | **Say:** “ready 3” | Aman's order #3 moves to Ready | ☐ |
| 6.9 | **Say:** “paid 1000 Rohan” | “Rs 1,000 received from Rohan Mehta. Balance now Rs 300.” | ☐ |
| 6.10 | **Say:** “balance Imran” | Panel: Total Rs 12,000 · Paid Rs 5,000 · Balance Rs 7,000 | ☐ |
| 6.11 | **Say:** “today's summary” | Orders taken 5 · Money received Rs 6,500 (500 + 5,000 + 1,000) · Due tomorrow lists Priya and Ravi, each with a **Send reminder** button | ☐ |
| 6.12 | **Say:** “ready Suresh” | Amber “No customer called ‘suresh’.” | ☐ |

---

## Flow 7: Repeat customer and editing

| # | Do | Expect | ✓ |
|---|---|---|---|
| 7.1 | **Say:** “Rohan's measurements” | Rohan's customer page opens | ☐ |
| 7.2 | Check the Measurements table | Shirt: Chest 38, Waist 32, Collar 15, Cuff 9 … with the date | ☐ |
| 7.3 | Click **New order with last measurements** | Back on Today with a card pre-filled from the last shirt, quantity 1, and the note “Measurements copied from last time…” | ☐ |
| 7.4 | **Say:** “chest 39, delivery 20 November” | “✓ Chest 38 → 39 · Delivery … 20 Nov”; the chest box shows “was 38 on …” | ☐ |
| 7.5 | **Save order** | Saved as #6 | ☐ |
| 7.6 | **Say:** “remind Rohan” | He has 2 open orders now: “Rohan Mehta has 2 open orders. Which one?” listing #1 and #6 | ☐ |
| 7.7 | Click #6 | Reminder message for order #6 | ☐ |
| 7.7b | **Say:** “ready Rohan” | Goes straight to #6 (#1 is already Ready), message drafted | ☐ |
| 7.8 | Open Rohan's page again (tap his name in the due list) | Measurements table shows Chest 39, Before 38, **+1** | ☐ |
| 7.9 | Open order #1 → **Edit order** | Card titled **Edit order #1** | ☐ |
| 7.10 | **Say:** “make delivery Saturday” then click **Save changes** | Back on Rohan's page; #1 shows the new date; still #1 | ☐ |
| 7.11 | Click **Edit name or phone**, change the name to `Rohan Mehra`, **Save** | Name updated on the page and in the due list | ☐ |

---

## Flow 8: Orders board, payments, fabric

| # | Do | Expect | ✓ |
|---|---|---|---|
| 8.1 | Click **Orders** | 4 columns: New · Cutting · Stitching · Ready. Imran's card shows no fabric badge | ☐ |
| 8.2 | On Priya's card click **Cutting →** | Card moves; toast with **Undo** | ☐ |
| 8.3 | Type `4` in the search box | Only order #4 (Imran) | ☐ |
| 8.4 | Clear search, tick **Show delivered** | A 5th column, “Delivered”, appears | ☐ |
| 8.5 | Open Imran → order #4 → type `2000` in “Payment received” → **Add payment** | Paid Rs 7,000, Balance Rs 5,000 | ☐ |
| 8.6 | Click **Job slip** | Slip with shop name, **Order #4**, Imran, sherwani, trial date, delivery, money. Click **Print**: the print preview shows only the slip | ☐ |
| 8.7 | Click **Cloth tag** → **Print** | Big “#4”, IMRAN, “1 sherwani”, due date | ☐ |

---

## Flow 9: Hinglish (optional but impressive)

Switch Wispr Flow's language to **Hinglish** first.

| # | Do | Expect | ✓ |
|---|---|---|---|
| 9.1 | **Say:** “Pooja kurta seena chautis kamar battis lambai byalis, aasteen saadhe bees, parso, advance 500” | Card: kurta, chest 34, waist 32, length 42, sleeve 20½, delivery the day after tomorrow, advance 500 | ☐ |
| 9.2 | If Flow wrote digits instead of Hindi words | Still fine: same result | ☐ |
| 9.3 | **Save order**, then **Say:** “Pooja ka order taiyar hai” | Pooja's order moves to Ready | ☐ |
| 9.4 | Settings → Message language → **Hinglish**, then **Say:** “remind Pooja” | “Namaste Pooja ji, aapke 1 kurta (order #…) taiyar hain…” | ☐ |

---

## Flow 10: Settings, backup, help

| # | Do | Expect | ✓ |
|---|---|---|---|
| 10.1 | Click **?** in the header | Help page: what to say, grouped by task, plus common questions | ☐ |
| 10.2 | **Settings** → **Centimetres** | Open a customer: measurements now in cm (38 in → 96.5) | ☐ |
| 10.3 | Switch back to **Inches** | Back to inches | ☐ |
| 10.4 | **Download backup** | A file `naap-backup-YYYY-MM-DD.json` downloads | ☐ |
| 10.5 | **Export orders as CSV** → open in Excel or Google Sheets | One row per garment, with Order #, customer and measurements | ☐ |
| 10.6 | Change **Shop name** to `Test Tailors Andheri`, click outside the box | Header updates; **Saved** badge | ☐ |

---

## Flow 11: Second device (the database)

| # | Do | Expect | ✓ |
|---|---|---|---|
| 11.1 | On your phone open the forwarded URL from the Codespace **Ports** tab (port 3000), and add `/app` | Sign-in screen (it may ask you to log in to GitHub first) | ☐ |
| 11.2 | **I have a shop** → mobile `9811122233`, password `tailor123` → **Sign in** | Same shop, same orders as the laptop | ☐ |
| 11.3 | On the phone, mark Priya **Ready** | Header **Saved** | ☐ |
| 11.4 | On the laptop, reload | Priya shows Ready | ☐ |
| 11.5 | On the phone, check the layout | Bottom tab bar (Today, Orders, Customers, Settings); no sideways scrolling; Save buttons reachable above the tab bar | ☐ |
| 11.6 | On the phone, try 5 wrong passwords in a private tab | “Too many wrong tries. Wait 10 minutes…” | ☐ |

## Flow 12: Offline

| # | Do | Expect | ✓ |
|---|---|---|---|
| 12.1 | Laptop: DevTools (F12) → Network → **Offline** | — | ☐ |
| 12.2 | **Say:** “delivered Aman” | Works on screen; header shows red “Offline: will save when back online” or “Not saved yet, retrying” | ☐ |
| 12.3 | Set Network back to **No throttling** | Header goes **Saving… → Saved** within a few seconds | ☐ |
| 12.4 | Reload | Aman still Delivered | ☐ |

---

## Flow 13: What a judge sees

Do this in a **private window**.

| # | Do | Expect | ✓ |
|---|---|---|---|
| 13.1 | Open http://localhost:3000 | Landing page, no sign-in needed | ☐ |
| 13.2 | Click **Try the demo shop** | Yellow bar “Demo shop. Sample orders, saved on this device only.” Sharma Tailors with ~10 orders; Aman Verma overdue in red | ☐ |
| 13.3 | Click the sample buttons one by one: **Rohan shirt order**, then **collar is 15, not 15½**, **Save order**, **ready Rohan**, **kurta chest 140**, **Hinglish kurta** | Each works without Wispr Flow | ☐ |
| 13.4 | Open Rohan's page | Chest 38, before 37, **+1** | ☐ |

---

## Flow 14: Accessibility spot checks

| # | Do | Expect | ✓ |
|---|---|---|---|
| 14.1 | Reload Today, press **Tab** repeatedly | First stop “Skip to main content”; then a clear blue focus ring on every control; you can reach and press Save with Enter | ☐ |
| 14.2 | Moon button in the header | Dark theme; all text readable | ☐ |
| 14.3 | Laptop on a table, step back about 1 m | You can read the measurement numbers on the card | ☐ |
| 14.4 | Optional: macOS VoiceOver (Cmd+F5) or Windows NVDA | Saving or changing the card is announced | ☐ |

## Flow 15: Hindi and the microphone

| # | Do | Expect | ✓ |
|---|---|---|---|
| 15.1 | Landing page → click **हिन्दी** (top right) | Whole page in Hindi: “दोनों हाथों से नाप लीजिए। ऑर्डर बोल दीजिए।” | ☐ |
| 15.2 | Reload | Still Hindi | ☐ |
| 15.3 | **डेमो दुकान खोलें** | App in Hindi: tabs आज · ऑर्डर · ग्राहक · सेटिंग | ☐ |
| 15.4 | Tap the sample **Rohan का शर्ट ऑर्डर** | Card “ऑर्डर जाँचें”, labels सीना / कमर / गला, summary in Hindi | ☐ |
| 15.5 | Tap **गला 15** | “✓ गला 15½ → 15” | ☐ |
| 15.6 | Tap the **🎙 बोलिए** button (Chrome or Edge), allow the microphone, say: “Meera ब्लाउज़ सीना चौंतीस कमर तीस, कल डिलीवरी” | Words appear live in the box; it stops ~2.5 s after you finish; card opens with blouse, bust 34, waist 30, tomorrow | ☐ |
| 15.7 | Say with the mic: “Meera का ऑर्डर तैयार है” | WhatsApp message in Hindi (“नमस्ते Meera जी…”) | ☐ |
| 15.8 | Click **बोलकर सुनाएँ** on a card | Summary read aloud in Hindi (needs a Hindi voice on the device) | ☐ |
| 15.9 | Header **EN** | Everything back to English, including the WhatsApp message language | ☐ |
| 15.10 | English mode, mic: “Rohan Mehta shirt chest 38 collar 15 and a half, Friday” | Card opens correctly | ☐ |

---

## When you're done

- Tell me the step numbers that failed, with what you said and what you saw.
- For the write-up: try 10–15 real orders from a tailor's register (change the names). Count how many came out right on the first try. That number is your “real result”.
- To start fresh: sign in with a new mobile number, or ask me to clear the test shop from the database.
