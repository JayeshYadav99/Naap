'use client'

import { useLang, type Lang } from '@/i18n'

interface HelpContent {
  title: string
  intro: string
  groups: { group: string; lines: [string, string][] }[]
  faqTitle: string
  faq: [string, string][]
  back: string
}

const CONTENT: Record<Lang, HelpContent> = {
  en: {
    title: 'Help: what can I say?',
    intro: 'Say or type any of these in the big box on the Today screen, or tap the microphone. Naap works out whether it is a new order, a correction or a question.',
    groups: [
      { group: 'Take an order', lines: [
        ['Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, collar 15 and a half, two shirts, delivery Friday, advance 500', 'New order card opens for you to check'],
        ['Pooja kurta seena 34 kamar 30 lambai 42, parso', 'Hindi words and numbers work too'],
        ['Imran sherwani chest 40, trial Tuesday, delivery 14 Nov, own fabric', 'Trial date and fabric are noted'],
        ['Ravi pant shorten 1 inch, 50 rupees, kal', 'Saved as an alteration job'],
      ] },
      { group: 'Fix the open card', lines: [
        ['collar is 15, not 15 and a half', 'Changes one number'],
        ['make delivery Saturday', 'Changes the date'],
        ['advance 1000 · total 1800', 'Changes the money'],
        ['name is Rohan Mehra · remove the fit · add note pocket on left', 'Other fixes'],
      ] },
      { group: 'Move work along', lines: [
        ['ready Rohan · ready 47 · ready Rohan kurta', 'Marks it Ready and drafts the WhatsApp message'],
        ['delivered Meera · cutting Kavita · stitching 45', 'Changes the status'],
        ['undo', 'Takes back the last change'],
      ] },
      { group: 'Ask Naap', lines: [
        ['what’s due this week · due tomorrow · overdue', 'Filters the due list'],
        ['today’s summary · aaj ka hisaab', 'Orders taken, money received, reminders for tomorrow'],
        ['balance Rajesh · paid 500 Meera', 'Shows or records money'],
        ['Rohan’s measurements · show 47', 'Opens the customer page'],
        ['remind Sunita', 'Drafts a reminder message'],
        ['who still owes money · what’s ready · any trials this week · whose fabric hasn’t come', 'Lists across the whole shop'],
        ['how many orders this month · how much did I earn this week', 'Numbers for today, the last 7 days or this month'],
        ['Rohan’s phone number · Rohan’s last order', 'Phone with Call and WhatsApp buttons; opens the last order'],
      ] },
    ],
    faqTitle: 'Common questions',
    faq: [
      ['How do I speak to Naap?', 'Three ways: hold your Wispr Flow key and speak (best), tap the microphone button next to the box, or type. All three fill the same box.'],
      ['What if Naap hears a number wrong?', 'Nothing is saved until you press Save. Say the correction or type in the box on the card. Unclear numbers are left blank and marked in amber; Naap never guesses.'],
      ['Why is a box red?', 'The number looks unusual for that garment, for example chest 140 (probably centimetres). Check it with the customer. You can still save.'],
      ['How do I change an order after saving?', 'Tap the customer’s name in the due list, open the order, and press Edit order.'],
      ['What is the number like #47?', 'The order number. Write it on the slip and the cloth tag. You can say “ready 47” or search “47” on the Orders screen.'],
      ['Does Naap send WhatsApp messages by itself?', 'No. It opens WhatsApp with the message filled in. You check it and press send.'],
      ['Can I use Naap in Hindi?', 'Yes. Pick हिन्दी at the top. Screens, messages and the microphone switch to Hindi. You can speak in Hindi, English or a mix.'],
      ['Where is my data kept?', 'With a shop account, online in a secure database, so it opens on any phone or laptop where you sign in. The demo shop saves on this device only.'],
    ],
    back: 'Back to Today',
  },
  hi: {
    title: 'मदद: मैं क्या बोल सकता हूँ?',
    intro: 'आज वाली स्क्रीन के बड़े बॉक्स में इनमें से कुछ भी बोलें या टाइप करें, या माइक दबाएँ। नाप खुद समझ लेता है कि यह नया ऑर्डर है, सुधार है या सवाल।',
    groups: [
      { group: 'ऑर्डर लें', lines: [
        ['Rohan Mehta, 98765 43210, शर्ट, सीना 38, कमर 32, गला साढ़े 15, दो शर्ट, शुक्रवार डिलीवरी, एडवांस 500', 'जाँचने के लिए नया ऑर्डर कार्ड खुलता है'],
        ['Pooja कुर्ता सीना चौंतीस कमर तीस लंबाई बयालीस, परसों', 'हिन्दी में गिनती भी चलती है'],
        ['Imran शेरवानी सीना 40, ट्रायल मंगलवार, डिलीवरी 14 नवंबर, अपना कपड़ा', 'ट्रायल और कपड़े की बात नोट होती है'],
        ['Ravi पैंट shorten 1 इंच, 50 रुपये, कल', 'ऑल्टरेशन के काम की तरह सेव होता है'],
      ] },
      { group: 'खुला कार्ड ठीक करें', lines: [
        ['गला 15', 'एक नाप बदलता है'],
        ['डिलीवरी शनिवार', 'तारीख बदलती है'],
        ['एडवांस 1000 · कुल 1800', 'पैसे बदलते हैं'],
        ['नोट बाईं जेब', 'नोट जोड़ता है'],
      ] },
      { group: 'काम आगे बढ़ाएँ', lines: [
        ['Rohan का ऑर्डर तैयार है · ready 47', 'तैयार करता है और WhatsApp संदेश बनाता है'],
        ['Meera delivered · cutting Kavita', 'स्थिति बदलता है'],
        ['undo', 'आख़िरी बदलाव वापस लेता है'],
      ] },
      { group: 'नाप से पूछें', lines: [
        ['इस हफ़्ते क्या ड्यू है · कल क्या ड्यू है', 'डिलीवरी सूची छाँटता है'],
        ['आज का हिसाब', 'आज के ऑर्डर, मिले पैसे, कल की याद'],
        ['Rajesh का बैलेंस · Meera ने 500 दिए', 'पैसे दिखाता या जोड़ता है'],
        ['Rohan का नाप दिखाओ', 'ग्राहक का पेज खोलता है'],
        ['किसका पैसा बाकी है · kya ready hai · trial kab hai · kapda nahi aaya', 'पूरी दुकान की सूची'],
        ['is mahine kitna kamaya · kitne order is hafte', 'आज, पिछले 7 दिन या इस महीने के आँकड़े'],
        ['Rohan ka number · Rohan ka pichla order', 'फ़ोन, कॉल और WhatsApp बटन; पिछला ऑर्डर खोलता है'],
      ] },
    ],
    faqTitle: 'आम सवाल',
    faq: [
      ['नाप से कैसे बोलूँ?', 'तीन तरीके: Wispr Flow बटन दबाकर बोलें (सबसे अच्छा), बॉक्स के पास माइक दबाएँ, या टाइप करें। तीनों एक ही बॉक्स भरते हैं।'],
      ['अगर नंबर गलत सुना गया तो?', 'सेव दबाने से पहले कुछ सेव नहीं होता। सुधार बोलें या कार्ड पर टाइप करें। साफ़ न सुना नंबर खाली और पीला दिखता है; नाप कभी अंदाज़ा नहीं लगाता।'],
      ['कोई बॉक्स लाल क्यों है?', 'उस कपड़े के लिए नंबर अजीब लगता है, जैसे सीना 140 (शायद सेंटीमीटर)। ग्राहक से जाँच लें। फिर भी सेव कर सकते हैं।'],
      ['सेव करने के बाद ऑर्डर कैसे बदलूँ?', 'डिलीवरी सूची में ग्राहक के नाम पर दबाएँ, ऑर्डर खोलें, और “ऑर्डर बदलें” दबाएँ।'],
      ['#47 जैसा नंबर क्या है?', 'ऑर्डर नंबर। इसे पर्ची और कपड़े के टैग पर लिखें। “ready 47” बोल सकते हैं या ऑर्डर स्क्रीन पर “47” खोज सकते हैं।'],
      ['क्या नाप खुद WhatsApp भेजता है?', 'नहीं। यह WhatsApp में संदेश भरकर खोलता है। आप जाँचकर भेजें दबाते हैं।'],
      ['मेरा डेटा कहाँ रहता है?', 'दुकान खाते के साथ, सुरक्षित डेटाबेस में ऑनलाइन, ताकि जिस फ़ोन या लैपटॉप पर साइन इन करें वहाँ खुले। डेमो दुकान सिर्फ़ इसी डिवाइस पर रहती है।'],
    ],
    back: 'आज पर वापस',
  },
}

export function HelpView() {
  const { lang } = useLang()
  const c = CONTENT[lang]
  return (
    <>
      <div className="view-head"><h1 className="view-title" tabIndex={-1}>{c.title}</h1></div>
      <p className="hint" style={{ marginBottom: 18, maxWidth: '62ch' }}>{c.intro}</p>
      <div className="help-grid">
        {c.groups.map(g => (
          <section key={g.group} className="panel help-card" aria-labelledby={`h-${g.group}`}>
            <h2 id={`h-${g.group}`}>{g.group}</h2>
            <ul>
              {g.lines.map(([say, does]) => (
                <li key={say}><q>{say}</q><span className="hint">{does}</span></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="panel help-card" aria-labelledby="faq-h" style={{ marginTop: 20 }}>
        <h2 id="faq-h">{c.faqTitle}</h2>
        {c.faq.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <p style={{ marginTop: 20 }}><a className="btn btn-primary btn-lg" href="#today">{c.back}</a></p>
    </>
  )
}
