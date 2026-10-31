import type { Garment } from '@/types'
import { translate, type Lang, type Key } from '@/i18n/translate'

export const GARMENT_WORDS: Record<string, Garment> = {}
const G: [Garment, string][] = [
  ['shirt', 'shirt shirts kameez'],
  ['trouser', 'trouser trousers pant pants patloon pantaloon pantaloons patlun jeans'],
  ['kurta', 'kurta kurtas kurti kurtis'],
  ['pyjama', 'pyjama pyjamas pajama pajamas payjama churidar'],
  ['blouse', 'blouse blouses choli'],
  ['salwar', 'salwar salwars salwaar shalwar'],
  ['suit', 'suit suits'],
  ['blazer', 'blazer blazers coat coats'],
  ['sherwani', 'sherwani sherwanis'],
  ['lehenga', 'lehenga lehengas lehnga lahenga ghagra'],
  ['dress', 'dress dresses frock frocks gown gowns'],
  ['waistcoat', 'waistcoat waistcoats vest vests'],
  ['jacket', 'jacket jackets bandhgala'],
]
for (const [g, words] of G) for (const w of words.split(' ')) GARMENT_WORDS[w] = g

export const GARMENT_LABEL: Record<Garment, string> = {
  shirt: 'Shirt', trouser: 'Trouser', kurta: 'Kurta', pyjama: 'Pyjama', blouse: 'Blouse',
  salwar: 'Salwar', suit: 'Suit', blazer: 'Blazer', sherwani: 'Sherwani', lehenga: 'Lehenga',
  dress: 'Dress', waistcoat: 'Waistcoat', jacket: 'Jacket',
}
export const GARMENT_PLURAL: Record<Garment, string> = {
  shirt: 'shirts', trouser: 'trousers', kurta: 'kurtas', pyjama: 'pyjamas', blouse: 'blouses',
  salwar: 'salwars', suit: 'suits', blazer: 'blazers', sherwani: 'sherwanis', lehenga: 'lehengas',
  dress: 'dresses', waistcoat: 'waistcoats', jacket: 'jackets',
}
export const ALL_GARMENTS = Object.keys(GARMENT_LABEL) as Garment[]

/** Canonical measurement keys and the phrases a tailor might say for them (longest first is handled by the matcher). */
const M: [string, string[]][] = [
  ['chest', ['chest', 'bust', 'seena', 'sina', 'seenaa', 'chhati', 'chati', 'chhaati']],
  ['waist', ['waist', 'kamar', 'kammar', 'kamr']],
  ['hip', ['hip', 'hips', 'seat', 'kulha', 'hip round']],
  ['shoulder', ['shoulder', 'shoulders', 'kandha', 'kandhe', 'kandhaa', 'mohda', 'monda']],
  ['sleeve', ['sleeve', 'sleeves', 'baju', 'baaju', 'bazu', 'baazu', 'aasteen', 'asteen', 'astin', 'sleeve length']],
  ['length', ['length', 'lambai', 'lambaai', 'lambayi', 'full length', 'total length']],
  ['collar', ['collar', 'neck', 'gala', 'galla', 'neck round']],
  ['armhole', ['armhole', 'arm hole', 'armholes', 'mudda', 'muddha']],
  ['bicep', ['bicep', 'biceps', 'arm round', 'dola', 'daula']],
  ['cuff', ['cuff', 'cuffs', 'wrist', 'kalai', 'kalaai']],
  ['thigh', ['thigh', 'thighs', 'jangh', 'jaangh', 'raan']],
  ['knee', ['knee', 'knees', 'ghutna', 'ghutne', 'goda']],
  ['bottom', ['bottom', 'bottoms', 'mohri', 'mori', 'moree', 'paincha', 'pauncha', 'ankle', 'opening']],
  ['inseam', ['inseam', 'inside length', 'inner length', 'inside leg']],
  ['rise', ['rise', 'crotch', 'fork', 'latak']],
  ['frontLength', ['front length']],
  ['backLength', ['back length']],
  ['neckFront', ['front neck depth', 'neck depth front', 'front neck', 'front gala', 'gala front', 'front depth']],
  ['neckBack', ['back neck depth', 'neck depth back', 'back neck', 'back gala', 'gala back', 'back depth']],
]

export const MEASURE_PHRASES: { words: string[]; key: string }[] = M
  .flatMap(([key, phrases]) => phrases.map(p => ({ key, words: p.split(' ') })))
  .sort((a, b) => b.words.length - a.words.length)

/** Label for a measurement key; chest reads as "Bust" on women's garments. */
export function measureLabel(key: string, garment?: Garment, lang: Lang = 'en'): string {
  let k = key
  if (key === 'chest' && garment && ['blouse', 'dress', 'lehenga'].includes(garment)) k = 'bust'
  else if (key === 'collar' && garment && !['shirt', 'kurta'].includes(garment)) k = 'neck'
  else if (key === 'bottom' && garment && ['salwar', 'pyjama'].includes(garment)) k = 'mohri'
  return k in MEASURE_LABEL || k === 'bust' || k === 'neck' || k === 'mohri' ? translate(lang, `m.${k}` as Key) : key
}

export function garmentLabel(g: Garment, lang: Lang = 'en', plural = false): string {
  return translate(lang, `${plural ? 'gp' : 'g'}.${g}` as Key)
}
const MEASURE_LABEL: Record<string, string> = {
  chest: 'Chest', waist: 'Waist', hip: 'Hip', shoulder: 'Shoulder', sleeve: 'Sleeve', length: 'Length',
  collar: 'Collar', armhole: 'Armhole', bicep: 'Bicep', cuff: 'Cuff', thigh: 'Thigh', knee: 'Knee',
  bottom: 'Bottom', inseam: 'Inseam', rise: 'Rise', frontLength: 'Front length', backLength: 'Back length',
  neckFront: 'Front neck depth', neckBack: 'Back neck depth',
}

/** Which measurements to show for each garment (spec §5.2). */
export const GARMENT_FIELDS: Record<Garment, string[]> = {
  shirt: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar', 'armhole', 'bicep', 'cuff'],
  kurta: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar', 'armhole', 'bicep', 'cuff'],
  trouser: ['waist', 'hip', 'thigh', 'knee', 'bottom', 'length', 'inseam', 'rise'],
  pyjama: ['waist', 'hip', 'thigh', 'knee', 'bottom', 'length', 'inseam', 'rise'],
  salwar: ['waist', 'hip', 'thigh', 'knee', 'bottom', 'length', 'inseam', 'rise'],
  blouse: ['chest', 'waist', 'shoulder', 'sleeve', 'length', 'frontLength', 'backLength', 'armhole', 'neckFront', 'neckBack'],
  suit: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar'],
  blazer: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar'],
  waistcoat: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar'],
  jacket: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar'],
  sherwani: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length', 'collar'],
  dress: ['chest', 'waist', 'hip', 'length', 'shoulder', 'sleeve'],
  lehenga: ['chest', 'waist', 'hip', 'length', 'shoulder', 'sleeve'],
}

export const FIT_WORDS: Record<string, string> = {
  slim: 'slim', regular: 'regular', loose: 'loose', comfortable: 'comfortable', comfort: 'comfortable',
  tight: 'tight', relaxed: 'relaxed', body: 'body fit', narrow: 'slim', dheela: 'loose', dhila: 'loose',
  fitted: 'slim', tung: 'tight', tang: 'tight',
}
