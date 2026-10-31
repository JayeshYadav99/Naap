'use client'

import Link from 'next/link'
import { LangSwitch, useLang, type Lang } from '@/i18n'
import s from './landing.module.css'

interface Copy {
  skip: string; tagline: string; signIn: string; kicker: string; title1: string; title2: string; lede: string
  tryDemo: string; signInShop: string; small: string; demoLabel: string; youSay: string; spoken: string
  existing: string; cardSub: string; m: [string, string, string?][]; total: string; add: string; caption: string
  howTitle: string; steps: { title: string; body: string }[]
  featTitle: string; features: { title: string; body: string }[]
  a11yTitle: string; a11yLede: string; checks: string[]
  ctaTitle: string; ctaLede: string; create: string; footer1: string; footer2: string
  pills: string[]; askTitle: string; askLede: string; you: string; naap: string; convo: [string, string][]
}

const COPY: Record<Lang, Copy> = {
  en: {
    skip: 'Skip to main content', tagline: 'the tailor’s voice measurement book', signIn: 'Sign in',
    kicker: 'For tailoring shops across India and the world',
    title1: 'Measure with both hands.', title2: 'Say the order.',
    lede: 'Your register gets messy. Slips get lost, and “32 or 37?” costs you a garment. Speak the order while you measure, in English or Hindi, and Naap writes it neatly, keeps track of delivery dates and balances, and remembers every customer.',
    tryDemo: 'Try the demo shop', signInShop: 'Sign in to your shop',
    small: 'The demo needs no sign-up. A free shop account saves your orders online so they open on your phone and laptop.',
    demoLabel: 'Example: a spoken order and the card it becomes', youSay: 'You say',
    spoken: '“Rohan Mehta, 98765 43210, shirt, chest 38, waist 32, shoulder 17, sleeve 24, collar 15 and a half, slim fit, two shirts, delivery next Friday, advance 500.”',
    existing: 'Existing customer', cardSub: '2 × Shirt · slim fit · delivery Fri 6 Nov',
    m: [['Chest', '38', 'was 37'], ['Waist', '32'], ['Shoulder', '17'], ['Sleeve', '24'], ['Collar', '15½']], total: 'Total', add: 'Add',
    caption: 'Every value is shown for you to confirm before it is saved.',
    howTitle: 'How it works',
    steps: [
      { title: 'Say it while you measure', body: 'Tape in one hand, no pencil needed. Hold the Wispr Flow key, or tap the microphone, and say the order the way you would tell your assistant.' },
      { title: 'Check the card', body: 'Every number shows up large. Anything missing is marked in amber, anything unusual in red. Say “collar is 15” to fix it, or tap “Read it aloud”.' },
      { title: 'Save, and it is tracked', body: 'The order joins your due list, the customer keeps their measurements for next time, and the WhatsApp message is one tap away.' },
    ],
    featTitle: 'Everything the paper register can’t do',
    features: [
      { title: 'Due list that never forgets', body: 'Overdue in red, then today, tomorrow and this week. See every balance to collect at a glance.' },
      { title: 'Repeat customers, found in a second', body: 'Say “Rohan’s measurements”. See last year’s card with what changed: chest 37 → 38.' },
      { title: 'English, Hindi, Hinglish', body: 'Seena, kamar, lambai, baju, mohri. “adtees” and “saadhe pandrah” are understood, in Latin letters or देवनागरी.' },
      { title: 'Never guesses a number', body: 'A wrong number ruins a garment. Unclear values stay blank and highlighted, and nothing is saved until you confirm.' },
      { title: '“Your order is ready”, drafted', body: 'Say “ready Meera”. The pickup message with the balance opens in WhatsApp, in English or Hindi, for you to send.' },
      { title: 'Job slip, cloth tag, trial dates', body: 'Order numbers, trial and fabric tracking, alteration jobs, and a slip and tag to print.' },
    ],
    a11yTitle: 'Made for the counter, not the desk',
    a11yLede: 'Readable at arm’s length, usable with busy hands, and kind to tired eyes at the end of a long day.',
    checks: [
      'Large text and numbers in a typeface designed for low vision',
      'Big buttons, easy to hit on a phone or a laptop',
      'Strong contrast in light and dark themes',
      'Works fully by keyboard and with screen readers',
      'Every screen in English and हिन्दी',
      'Speak with Wispr Flow or the built-in microphone, or just type',
    ],
    ctaTitle: 'Try it with the sample shop',
    ctaLede: 'Sharma Tailors is preloaded with orders, so the due list and customer pages are ready to explore. Tap a sample sentence if you don’t want to speak.',
    create: 'Create your shop',
    footer1: 'Built by voice with Wispr Flow for No Hands: The Wispr Challenge. Sample customers are made up.',
    footer2: 'Honest limits: rule-based reading can miss unusual phrasing, so the card always shows what was understood and keeps what you said. The browser microphone sends audio to the browser maker for recognition; Wispr Flow and typing do not go through the browser.',
    pills: ['English', 'हिन्दी', 'Hinglish', 'Works with Wispr Flow'],
    askTitle: 'Talk to it like a helper',
    askLede: 'The same box takes orders, fixes and questions. Naap answers on screen and out loud, so your hands stay on the tape.',
    you: 'You', naap: 'Naap',
    convo: [
      ['collar is 15, not 15 and a half', 'Collar changed from 15½ to 15.'],
      ['who still owes money?', '6 customers owe money. Total ₹16,700. Highest is Imran Shaikh, ₹7,000.'],
      ['Meera ka order taiyar hai', 'Meera’s 3 blouses are ready. The WhatsApp message is ready to send.'],
      ['how many orders this month?', 'This month: 8 orders, ₹10,800 received.'],
    ],
  },
  hi: {
    skip: 'मुख्य हिस्से पर जाएँ', tagline: 'दर्ज़ी की बोलने वाली नाप-पुस्तिका', signIn: 'साइन इन',
    kicker: 'भारत और दुनिया भर की सिलाई की दुकानों के लिए',
    title1: 'दोनों हाथों से नाप लीजिए।', title2: 'ऑर्डर बोल दीजिए।',
    lede: 'रजिस्टर गड़बड़ हो जाता है, पर्चियाँ खो जाती हैं, और “32 या 37?” की गलती से पूरा कपड़ा खराब होता है। नाप लेते-लेते हिन्दी या अंग्रेज़ी में ऑर्डर बोलिए। नाप उसे साफ़ लिखता है, डिलीवरी की तारीख और बाकी पैसे याद रखता है, और हर ग्राहक का नाप संभालकर रखता है।',
    tryDemo: 'डेमो दुकान खोलें', signInShop: 'अपनी दुकान में साइन इन करें',
    small: 'डेमो के लिए खाते की ज़रूरत नहीं। मुफ़्त दुकान खाता आपके ऑर्डर ऑनलाइन सेव करता है, ताकि फ़ोन और लैपटॉप दोनों पर खुलें।',
    demoLabel: 'उदाहरण: बोला गया ऑर्डर और उससे बना कार्ड', youSay: 'आप बोलते हैं',
    spoken: '“Rohan Mehta, 98765 43210, शर्ट, सीना 38, कमर 32, कंधा 17, बाजू 24, गला साढ़े 15, स्लिम फिटिंग, दो शर्ट, शुक्रवार डिलीवरी, एडवांस 500।”',
    existing: 'पुराने ग्राहक', cardSub: '2 × शर्ट · स्लिम फ़िटिंग · डिलीवरी शुक्र 6 नवं',
    m: [['सीना', '38', 'पहले 37'], ['कमर', '32'], ['कंधा', '17'], ['बाजू', '24'], ['गला', '15½']], total: 'कुल', add: 'डालें',
    caption: 'सेव होने से पहले हर नंबर आपको जाँचने के लिए दिखता है।',
    howTitle: 'यह कैसे काम करता है',
    steps: [
      { title: 'नाप लेते-लेते बोलिए', body: 'एक हाथ में फीता, पेंसिल की ज़रूरत नहीं। Wispr Flow बटन दबाएँ या माइक दबाएँ, और ऑर्डर वैसे ही बोलें जैसे अपने कारीगर को बताते हैं।' },
      { title: 'कार्ड जाँचिए', body: 'हर नंबर बड़े अक्षरों में दिखता है। जो छूट गया वह पीला, जो अजीब लगे वह लाल। ठीक करने के लिए “गला 15” बोलें, या “बोलकर सुनाएँ” दबाएँ।' },
      { title: 'सेव कीजिए, बाकी नाप संभालेगा', body: 'ऑर्डर डिलीवरी सूची में आ जाता है, ग्राहक का नाप अगली बार के लिए रहता है, और WhatsApp संदेश एक बटन दूर है।' },
    ],
    featTitle: 'जो काग़ज़ का रजिस्टर नहीं कर सकता',
    features: [
      { title: 'डिलीवरी सूची जो कुछ नहीं भूलती', body: 'देर वाले लाल में, फिर आज, कल और इस हफ़्ते। हर बाकी पैसा एक नज़र में।' },
      { title: 'पुराने ग्राहक, एक सेकंड में', body: '“Rohan का नाप दिखाओ” बोलें। पिछले साल का कार्ड और क्या बदला: सीना 37 → 38।' },
      { title: 'हिन्दी, अंग्रेज़ी, हिंग्लिश', body: 'सीना, कमर, लंबाई, बाजू, मोहरी। “अड़तीस” और “साढ़े पंद्रह” भी समझता है, देवनागरी में या अंग्रेज़ी अक्षरों में।' },
      { title: 'कभी अंदाज़ा नहीं', body: 'गलत नंबर से कपड़ा खराब होता है। साफ़ न सुना नंबर खाली और पीला रहता है, और आपके जाँचे बिना कुछ सेव नहीं होता।' },
      { title: '“आपका ऑर्डर तैयार है” संदेश तैयार', body: '“Meera का ऑर्डर तैयार है” बोलें। बाकी पैसे के साथ संदेश WhatsApp में, हिन्दी या अंग्रेज़ी में, भेजने के लिए खुलता है।' },
      { title: 'पर्ची, टैग, ट्रायल की तारीख', body: 'ऑर्डर नंबर, ट्रायल और कपड़े का हिसाब, ऑल्टरेशन का काम, और प्रिंट के लिए पर्ची और टैग।' },
    ],
    a11yTitle: 'काउंटर के लिए बना, मेज़ के लिए नहीं',
    a11yLede: 'हाथ भर की दूरी से पढ़ सकें, व्यस्त हाथों से चला सकें, और दिन के आख़िर में थकी आँखों को आराम दे।',
    checks: [
      'कम नज़र वालों के लिए बने फ़ॉन्ट में बड़े अक्षर और नंबर',
      'बड़े बटन, फ़ोन या लैपटॉप पर आसानी से दबें',
      'हल्की और गहरी दोनों थीम में साफ़ रंग',
      'पूरा कीबोर्ड से और स्क्रीन रीडर के साथ चलता है',
      'हर स्क्रीन हिन्दी और English में',
      'Wispr Flow या ऐप के माइक से बोलें, या बस टाइप करें',
    ],
    ctaTitle: 'नमूना दुकान के साथ आज़माइए',
    ctaLede: 'शर्मा टेलर्स में पहले से ऑर्डर भरे हैं, ताकि डिलीवरी सूची और ग्राहक पेज तुरंत देख सकें। बोलना न हो तो नमूना वाक्य दबाएँ।',
    create: 'अपनी दुकान बनाएँ',
    footer1: 'No Hands: The Wispr Challenge के लिए Wispr Flow से बोलकर बनाया गया। नमूना ग्राहक काल्पनिक हैं।',
    footer2: 'सच्ची सीमाएँ: नियम-आधारित पढ़ाई अनोखे वाक्य चूक सकती है, इसलिए कार्ड हमेशा दिखाता है कि क्या समझा गया और आपकी बात रखता है। ब्राउज़र का माइक पहचान के लिए आवाज़ ब्राउज़र कंपनी को भेजता है; Wispr Flow और टाइपिंग ब्राउज़र से नहीं जाते।',
    pills: ['हिन्दी', 'English', 'Hinglish', 'Wispr Flow के साथ'],
    askTitle: 'कारीगर की तरह बात कीजिए',
    askLede: 'एक ही बॉक्स में ऑर्डर, सुधार और सवाल। नाप स्क्रीन पर भी जवाब देता है और बोलकर भी, ताकि आपके हाथ फीते पर रहें।',
    you: 'आप', naap: 'नाप',
    convo: [
      ['गला 15 कर दो', 'गला 15½ से 15 कर दिया।'],
      ['किसका पैसा बाकी है?', '6 ग्राहकों का पैसा बाकी है। कुल ₹16,700। सबसे ज़्यादा Imran Shaikh, ₹7,000।'],
      ['Meera का ऑर्डर तैयार है', 'Meera के 3 ब्लाउज़ तैयार हैं। WhatsApp संदेश भेजने के लिए तैयार है।'],
      ['इस महीने कितने ऑर्डर?', 'इस महीने: 8 ऑर्डर, ₹10,800 मिले।'],
    ],
  },
}

const NUMS = ['1', '2', '3']

export default function Landing() {
  const { lang } = useLang()
  const c = COPY[lang]
  return (
    <div className={s.page}>
      <a className="skip" href="#content">{c.skip}</a>
      <header className={`${s.header} gutter`}>
        <div className={`wrap ${s.headerInner}`}>
          <span className={s.logo}>
            <span className={s.logoMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3B2F07" strokeWidth="2" strokeLinecap="round"><circle cx="10" cy="12" r="6.5" /><circle cx="10" cy="12" r="2" /><path d="M16.5 12H22v4h-5.5M18.5 12v2M20.5 12v2" /></svg>
            </span>
            Naap <span className={s.logoTag}>{c.tagline}</span>
          </span>
          <div className="row-actions" style={{ alignItems: 'center' }}>
            <LangSwitch />
            <Link href="/app" className="btn btn-primary">{c.signIn}</Link>
          </div>
        </div>
      </header>

      <main id="content">
        <section className={`${s.hero} gutter`} aria-labelledby="hero-title">
          <div className={`wrap ${s.heroGrid}`}>
            <div className={s.heroCopy}>
              <p className={s.kicker}>{c.kicker}</p>
              <ul className={s.pills} aria-label="Languages">
                {c.pills.map((x, i) => <li key={x} className={i === c.pills.length - 1 ? s.pillFlow : s.pill}>{x}</li>)}
              </ul>
              <h1 id="hero-title" className={s.title}>{c.title1} <span className={s.titleAccent}>{c.title2}</span></h1>
              <p className={s.lede}>{c.lede}</p>
              <div className="row-actions">
                <Link href="/app?demo=1" className="btn btn-primary btn-lg">{c.tryDemo}</Link>
                <Link href="/app" className="btn btn-ghost btn-lg">{c.signInShop}</Link>
              </div>
              <p className={s.small}>{c.small}</p>
            </div>

            <figure className={s.demo} aria-label={c.demoLabel}>
              <div className={s.speech}>
                <span className={s.speechLabel}>{c.youSay}</span>
                <p>{c.spoken}</p>
              </div>
              <div className={s.arrow} aria-hidden="true">↓</div>
              <div className={s.card}>
                <div className={s.cardHead}>
                  <strong>Rohan Mehta</strong>
                  <span className="badge b-info">{c.existing}</span>
                </div>
                <p className={s.cardSub}>{c.cardSub}</p>
                <dl className={s.measures}>
                  {c.m.map(([k, v, was]) => (
                    <div key={k}><dt>{k}</dt><dd>{v}{was && <small>{was}</small>}</dd></div>
                  ))}
                  <div className={s.missing}><dt>{c.total}</dt><dd>{c.add}</dd></div>
                </dl>
              </div>
              <figcaption className={s.small}>{c.caption}</figcaption>
            </figure>
          </div>
        </section>

        <section id="how" className={`${s.section} gutter`} aria-labelledby="how-title">
          <div className="wrap">
            <h2 id="how-title" className={s.h2}>{c.howTitle}</h2>
            <ol className={s.steps}>
              {c.steps.map((st, i) => (
                <li key={st.title} className={s.step}>
                  <span className={s.stepNum} aria-hidden="true">{NUMS[i]}</span>
                  <h3>{st.title}</h3>
                  <p>{st.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${s.section} ${s.alt} gutter`} aria-labelledby="ask-title">
          <div className={`wrap ${s.split}`}>
            <div>
              <h2 id="ask-title" className={s.h2}>{c.askTitle}</h2>
              <p className={s.lede}>{c.askLede}</p>
            </div>
            <ol className={s.convo}>
              {c.convo.map(([q, a]) => (
                <li key={q} className={s.turn}>
                  <p className={s.bubbleYou}><span className={s.who}>{c.you}</span>{q}</p>
                  <p className={s.bubbleNaap}><span className={s.who}>🔊 {c.naap}</span>{a}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${s.section} gutter`} aria-labelledby="feat-title">
          <div className="wrap">
            <h2 id="feat-title" className={s.h2}>{c.featTitle}</h2>
            <ul className={s.features}>
              {c.features.map(f => (
                <li key={f.title} className={s.feature}>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${s.section} ${s.alt} gutter`} aria-labelledby="a11y-title">
          <div className={`wrap ${s.split}`}>
            <div>
              <h2 id="a11y-title" className={s.h2}>{c.a11yTitle}</h2>
              <p className={s.lede}>{c.a11yLede}</p>
            </div>
            <ul className={s.checks}>
              {c.checks.map(x => <li key={x}>{x}</li>)}
            </ul>
          </div>
        </section>

        <section className={`${s.cta} gutter`} aria-labelledby="cta-title">
          <div className="wrap">
            <h2 id="cta-title" className={s.h2}>{c.ctaTitle}</h2>
            <p className={s.lede}>{c.ctaLede}</p>
            <div className="row-actions">
              <Link href="/app?demo=1" className="btn btn-primary btn-lg">{c.tryDemo}</Link>
              <Link href="/app" className="btn btn-ghost btn-lg">{c.create}</Link>
            </div>
          </div>
        </section>
      </main>

      <div className={s.stickyCta}>
        <Link href="/app?demo=1" className="btn btn-primary btn-lg">{c.tryDemo}</Link>
      </div>

      <footer className={`${s.footer} gutter`}>
        <div className="wrap">
          <p>{c.footer1}</p>
          <p>{c.footer2}</p>
        </div>
      </footer>
    </div>
  )
}
