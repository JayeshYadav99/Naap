// Turns spoken numbers into digits: "thirty eight" -> 38, "fifteen and a half" -> 15.5,
// "saadhe pandrah" -> 15.5, "adtees" -> 38, "15 1/2" -> 15.5, "point five" -> .5

const EN_UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
}
const EN_TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

// Hindi number words as Flow writes them in Hinglish (Latin script). Several spellings each.
const HI_RAW: [number, string][] = [
  [1, 'ek'], [2, 'do'], [3, 'teen'], [4, 'char chaar'], [5, 'paanch panch'], [6, 'chhe chhah chheh'],
  [7, 'saat'], [8, 'aath aat'], [9, 'nau'], [10, 'das dus'], [11, 'gyarah gyaarah gyara'],
  [12, 'barah baarah bara'], [13, 'terah tera'], [14, 'chaudah chaudha chauda'],
  [15, 'pandrah pandra pundrah pandhra'], [16, 'solah sola'], [17, 'satrah satra'],
  [18, 'atharah athara attharah'], [19, 'unnis unees unnees'], [20, 'bees bis'],
  [21, 'ikkis ikkees'], [22, 'baais bais baees'], [23, 'teis teyis tehees'], [24, 'chaubis chaubees chobis'],
  [25, 'pachis pachees pacchis'], [26, 'chhabbis chabbis chhabees'], [27, 'sattais sattaees'],
  [28, 'atthais athais athaais atthaees'], [29, 'untis unatees untees'], [30, 'tees tis'],
  [31, 'iktis ikattees ikatis'], [32, 'battis battees batis'], [33, 'tentis taintees taintis'],
  [34, 'chautis chauntees chauntis chotis'], [35, 'paintis paintees pentis'],
  [36, 'chhattis chattis chhattees chattees'], [37, 'saintis saintees sentis'],
  [38, 'adtis adtees artees artis aratis adatis adhtis'], [39, 'untalis unchalees untaalis'],
  [40, 'chalis chaalis chalees chaalees'], [41, 'iktalis ikatalis iktaalis'],
  [42, 'bayalis byalis bayaalis beyalis'], [43, 'tentalis taintalis taintaalis'],
  [44, 'chavalis chauvalis chauaalis chavaalis'], [45, 'paintalis pentalis paintaalis'],
  [46, 'chhiyalis chiyalis chhiyaalis'], [47, 'saintalis sentalis saintaalis'],
  [48, 'adtalis artalis adtaalis artaalis'], [49, 'unchas unchaas'], [50, 'pachas pachaas'],
  [51, 'ikyavan ikyaavan'], [52, 'bavan baavan'], [53, 'tirpan tirepan'], [54, 'chauvan chauvan'],
  [55, 'pachpan'], [56, 'chhappan chappan'], [57, 'sattavan'], [58, 'atthavan athavan'],
  [59, 'unsath'], [100, 'sau'],
]
const HI: Record<string, number> = {}
for (const [n, words] of HI_RAW) for (const w of words.split(' ')) HI[w] = n

// "saadhe 15" = 15.5, "sava 15" = 15.25, "paune 15" = 14.75
const HI_PREFIX: Record<string, number> = {
  saadhe: 0.5, sadhe: 0.5, saade: 0.5, saadhey: 0.5, sade: 0.5,
  sava: 0.25, savaa: 0.25, sawa: 0.25,
  paune: -0.25, pone: -0.25, paone: -0.25,
}
const HI_SPECIAL: Record<string, number> = { dedh: 1.5, derh: 1.5, dhai: 2.5, dhaai: 2.5, adhai: 2.5 }

export interface Token {
  /** Original text of the token (or joined text for merged number words). */
  t: string
  /** Lowercased text. */
  low: string
  /** Numeric value when this token is a number. */
  n?: number
  /** True for punctuation tokens such as "," and ".". */
  punct?: boolean
}

const TOKEN_RE = /\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\s*\/\s*\d+)?)?(?:st|nd|rd|th)?|[½¼¾]|[A-Za-z\u00C0-\u024F]+(?:['’][A-Za-z]+)?|[\u0900-\u097F]+|[^\sA-Za-z\d\u0900-\u097F]/g

export function tokenize(text: string): Token[] {
  const out: Token[] = []
  for (const m of text.matchAll(TOKEN_RE)) {
    const t = m[0]
    const low = t.toLowerCase().replace('’', "'")
    if (/^\d+(\.\d+)?$/.test(t)) out.push({ t, low, n: parseFloat(t) })
    else if (/^[^\sA-Za-z\d½¼¾\u0900-\u097F]$/.test(t)) out.push({ t, low, punct: true })
    else out.push({ t, low })
  }
  return out
}

const FRACTION_GLYPH: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 }

function simpleFraction(low: string): number | undefined {
  const m = low.match(/^(\d)\s*\/\s*(2|4|8)$/)
  if (!m) return undefined
  const num = +m[1], den = +m[2]
  return num < den ? num / den : undefined
}

/** Reads an English number word run at i. Returns value and tokens consumed. */
function readEnglish(toks: Token[], i: number): [number, number] | undefined {
  const w = toks[i]?.low
  if (w === undefined) return undefined
  let value: number | undefined
  let used = 0
  // "thirty-eight" arrives as "thirty" "-" "eight"
  if (w in EN_TENS) {
    value = EN_TENS[w]; used = 1
    let j = i + 1
    if (toks[j]?.low === '-') j++
    const u = toks[j]?.low
    if (u && u in EN_UNITS && EN_UNITS[u] > 0 && EN_UNITS[u] < 10) { value += EN_UNITS[u]; used = j - i + 1 }
  } else if (w in EN_UNITS) {
    value = EN_UNITS[w]; used = 1
  } else if ((w === 'a' || w === 'one') && toks[i + 1]?.low === 'hundred') {
    value = 1; used = 1
  } else return undefined
  // "one hundred (and) forty"
  if (toks[i + used]?.low === 'hundred') {
    value *= 100; used++
    let j = i + used
    if (toks[j]?.low === 'and') j++
    const rest = readEnglish(toks, j)
    if (rest && rest[0] < 100) { value += rest[0]; used = j - i + rest[1] }
  }
  return [value, used]
}

/** Reads a fractional tail after a number: "and a half", "and three quarters", "point five", "1/2", "½". */
function readFractionTail(toks: Token[], i: number): [number, number] | undefined {
  const a = toks[i]?.low, b = toks[i + 1]?.low, c = toks[i + 2]?.low, d = toks[i + 3]?.low
  if (a === undefined) return undefined
  if (a in FRACTION_GLYPH) return [FRACTION_GLYPH[a], 1]
  const sf = simpleFraction(a)
  if (sf !== undefined) return [sf, 1]
  if (a === 'and' || a === '&') {
    if ((b === 'a' || b === 'one') && (c === 'half')) return [0.5, 3]
    if (b === 'half') return [0.5, 2]
    if ((b === 'a' || b === 'one') && (c === 'quarter' || c === 'fourth')) return [0.25, 3]
    if (b === 'quarter') return [0.25, 2]
    if ((b === 'three' || b === '3') && (c === 'quarter' || c === 'quarters' || c === 'fourth' || c === 'fourths')) return [0.75, 3]
    if (b && b in FRACTION_GLYPH) return [FRACTION_GLYPH[b], 2]
    if (b) { const f = simpleFraction(b); if (f !== undefined) return [f, 2] }
    void d
  }
  if (a === 'point' || a === 'dot') {
    // "point five" / "point 5" / "point two five"
    let digits = ''
    let j = i + 1
    while (j < toks.length) {
      const w = toks[j].low
      if (/^\d+$/.test(w)) { digits += w; j++; break }
      if (w in EN_UNITS && EN_UNITS[w] < 10) { digits += String(EN_UNITS[w]); j++; continue }
      break
    }
    if (digits) return [parseFloat('0.' + digits), j - i]
  }
  return undefined
}

const round = (n: number) => Math.round(n * 1000) / 1000

/**
 * Merges number words and fractions into numeric tokens.
 * Leaves tokens it cannot read untouched.
 */
export function numberize(toks: Token[]): Token[] {
  const out: Token[] = []
  for (let i = 0; i < toks.length; ) {
    const tk = toks[i]
    let value: number | undefined
    let used = 0
    let offset = 0

    // Hindi prefix: "saadhe pandrah"
    if (tk.low in HI_PREFIX) {
      const next = toks[i + 1]
      const nv = next?.n ?? (next ? HI[next.low] ?? readEnglish(toks, i + 1)?.[0] : undefined)
      if (nv !== undefined) {
        const engUsed = next?.n === undefined && next && !(next.low in HI) ? readEnglish(toks, i + 1)?.[1] ?? 1 : 1
        out.push({ t: toks.slice(i, i + 1 + engUsed).map(x => x.t).join(' '), low: '', n: round(nv + HI_PREFIX[tk.low]) })
        i += 1 + engUsed
        continue
      }
    }
    if (tk.low in HI_SPECIAL) { value = HI_SPECIAL[tk.low]; used = 1 }
    else if (tk.n !== undefined) { value = tk.n; used = 1 }
    else if (tk.low in FRACTION_GLYPH) { value = FRACTION_GLYPH[tk.low]; used = 1 }
    else {
      const en = readEnglish(toks, i)
      if (en) { value = en[0]; used = en[1] }
      // "do" is only two before a garment ("do kurta"); otherwise it's the English verb.
      else if (tk.low in HI && (tk.low !== 'do' || isGarmentish(toks[i + 1]?.low))) { value = HI[tk.low]; used = 1 }
    }

    if (value === undefined) { out.push(tk); i++; continue }

    const tail = readFractionTail(toks, i + used)
    if (tail) { offset = tail[0]; used += tail[1] }
    const t = toks.slice(i, i + used).map(x => x.t).join(' ')
    out.push({ t, low: t.toLowerCase(), n: round(value + offset) })
    i += used
  }
  return out
}

const GARMENTISH = /^(shirt|shirts|kurta|kurtas|kurti|pant|pants|trouser|trousers|blouse|blouses|pyjama|pajama|salwar|suit|suits|jacket|blazer|sherwani|lehenga|dress|waistcoat|piece|pieces|pcs)$/
function isGarmentish(w?: string) {
  return !!w && GARMENTISH.test(w)
}

// Hindi in Devanagari (from the browser mic or Flow in Hindi) is mapped to the Latin keywords the parser knows.
// Names stay as spoken.
const DEVANAGARI: Record<string, string> = {}
const DV: [string, string][] = [
  ['seena', 'सीना सीने'], ['chhati', 'छाती'], ['chest', 'चेस्ट'], ['bust', 'बस्ट'], ['kamar', 'कमर'], ['waist', 'वेस्ट'],
  ['kandha', 'कंधा कंधे कन्धा कन्धे'], ['shoulder', 'शोल्डर'], ['baju', 'बाजू बाँह बांह'], ['aasteen', 'आस्तीन'], ['sleeve', 'स्लीव'],
  ['lambai', 'लंबाई लम्बाई'], ['length', 'लेंथ'], ['gala', 'गला गले'], ['collar', 'कॉलर कालर'], ['mohri', 'मोहरी मोरी'],
  ['hip', 'हिप कूल्हा'], ['jangh', 'जांघ जाँघ'], ['ghutna', 'घुटना घुटने'], ['armhole', 'आर्महोल'], ['kalai', 'कलाई'],
  ['shirt', 'शर्ट कमीज़ कमीज'], ['pant', 'पैंट पेंट पतलून'], ['trouser', 'ट्राउज़र ट्राउजर'], ['kurta', 'कुर्ता कुर्ते कुर्ती'],
  ['pyjama', 'पजामा पायजामा'], ['blouse', 'ब्लाउज़ ब्लाउज'], ['salwar', 'सलवार'], ['suit', 'सूट'], ['blazer', 'ब्लेज़र ब्लेजर कोट'],
  ['sherwani', 'शेरवानी'], ['lehenga', 'लहंगा लहँगा'], ['dress', 'ड्रेस फ्रॉक'], ['jacket', 'जैकेट'], ['waistcoat', 'वास्कट'],
  ['ek', 'एक'], ['do', 'दो'], ['teen', 'तीन'], ['char', 'चार'], ['paanch', 'पांच पाँच'], ['chhe', 'छह छः'], ['saat', 'सात'],
  ['aath', 'आठ'], ['nau', 'नौ'], ['das', 'दस'], ['gyarah', 'ग्यारह'], ['barah', 'बारह'], ['terah', 'तेरह'], ['chaudah', 'चौदह'],
  ['pandrah', 'पंद्रह पन्द्रह'], ['solah', 'सोलह'], ['satrah', 'सत्रह'], ['atharah', 'अठारह'], ['unnis', 'उन्नीस'], ['bees', 'बीस'],
  ['ikkis', 'इक्कीस'], ['baais', 'बाईस'], ['teis', 'तेईस'], ['chaubis', 'चौबीस'], ['pachis', 'पच्चीस'], ['chhabbis', 'छब्बीस'],
  ['sattais', 'सत्ताईस'], ['atthais', 'अट्ठाईस अठ्ठाईस'], ['untis', 'उनतीस'], ['tees', 'तीस'], ['iktis', 'इकतीस'], ['battis', 'बत्तीस'],
  ['tentis', 'तैंतीस'], ['chautis', 'चौंतीस चौतीस'], ['paintis', 'पैंतीस'], ['chhattis', 'छत्तीस'], ['saintis', 'सैंतीस'],
  ['adtis', 'अड़तीस अडतीस'], ['untalis', 'उनतालीस'], ['chalis', 'चालीस'], ['iktalis', 'इकतालीस'], ['bayalis', 'बयालीस'],
  ['tentalis', 'तैंतालीस'], ['chavalis', 'चवालीस चौवालीस'], ['paintalis', 'पैंतालीस'], ['chhiyalis', 'छियालीस'],
  ['saintalis', 'सैंतालीस'], ['adtalis', 'अड़तालीस'], ['unchas', 'उनचास'], ['pachas', 'पचास'],
  ['saadhe', 'साढ़े साढे'], ['sava', 'सवा'], ['paune', 'पौने'], ['dedh', 'डेढ़ डेढ'], ['dhai', 'ढाई'],
  ['aaj', 'आज'], ['kal', 'कल'], ['parso', 'परसों परसो'], ['somvar', 'सोमवार'], ['mangalvar', 'मंगलवार'], ['budhvar', 'बुधवार'],
  ['guruvar', 'गुरुवार वीरवार'], ['shukravar', 'शुक्रवार'], ['shanivar', 'शनिवार'], ['ravivar', 'रविवार इतवार'],
  ['agle', 'अगले'], ['hafte', 'हफ्ते हफ़्ते हफ्ता'], ['din', 'दिन'], ['mein', 'में'], ['baad', 'बाद'],
  ['advance', 'एडवांस एडवान्स अग्रिम'], ['jama', 'जमा'], ['total', 'कुल टोटल'], ['rupees', 'रुपये रुपए रुपया रु'], ['baaki', 'बाकी बाक़ी'],
  ['paid', 'दिए दिये'], ['dheela', 'ढीला ढीली'], ['tight', 'टाइट तंग'], ['slim', 'स्लिम'], ['regular', 'रेगुलर'],
  ['taiyar', 'तैयार'], ['ka', 'का'], ['ki', 'की'], ['ke', 'के'], ['ne', 'ने'], ['delivered', 'डिलीवर'],
  ['de', 'दे'], ['diya', 'दिया'], ['hisaab', 'हिसाब'], ['dikhao', 'दिखाओ दिखाइए'], ['naap', 'नाप'], ['balance', 'बैलेंस'],
  ['undo', 'अनडू'], ['madad', 'मदद'], ['delivery', 'डिलीवरी'], ['note', 'नोट'], ['trial', 'ट्रायल'], ['fitting', 'फिटिंग'],
  ['kapda', 'कपड़ा कपडा'], ['apna', 'अपना'], ['inch', 'इंच'], ['cm', 'सेमी सेंटीमीटर'], ['ready', 'रेडी'], ['due', 'ड्यू'],
  ['kya', 'क्या'], ['nahi', 'नहीं नही'], ['and', 'और'], ['half', 'आधा'], ['order', 'ऑर्डर आर्डर'], ['remind', 'याद'], ['name', 'नाम'], ['hai', 'है'],
]
for (const [latin, words] of DV) for (const w of words.split(' ')) DEVANAGARI[w] = latin

/** Devanagari digits to ASCII, Hindi keywords to their Latin form, danda to a full stop. */
export function normalizeScript(text: string): string {
  return text
    .replace(/[०-९]/g, d => String('०१२३४५६७८९'.indexOf(d)))
    .replace(/।/g, '.')
    .replace(/[\u0900-\u097F]+/g, w => DEVANAGARI[w] ?? w)
}
