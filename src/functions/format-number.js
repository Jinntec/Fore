/**
 * XPath 3.1 `fn:format-number($value, $picture)` (F&O 3.1, section 4.7), which FontoXPath doesn't
 * provide. Supports the default decimal format: `.` decimal separator, `,` grouping separator,
 * `0` mandatory and `#` optional digits, `%` / `‰` scaling, passive prefix/suffix characters and
 * an optional negative sub-picture separated by `;`. Exponent pictures and named decimal formats
 * are not supported.
 */

const ACTIVE = '#0,.';

function roundHalfEven(scaled) {
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  if (Math.abs(diff - 0.5) < 1e-9) {
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return Math.round(scaled);
}

function group(digits, size) {
  if (!size) return digits;
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % size === 0) out += ',';
    out += digits[i];
  }
  return out;
}

/**
 * @param {number|null} value
 * @param {string} picture
 * @returns {string}
 */
export function formatNumber(value, picture) {
  if (value === null || value === undefined) value = NaN;
  if (Number.isNaN(value)) return 'NaN';

  const subpictures = picture.split(';');
  if (subpictures.length > 2) {
    throw new Error('FODF1310: picture string has more than two sub-pictures');
  }
  const negative = value < 0 || Object.is(value, -0);
  const useNegativePicture = negative && subpictures.length === 2;
  const pic = useNegativePicture ? subpictures[1] : subpictures[0];

  const first = [...pic].findIndex(c => ACTIVE.includes(c));
  let last = -1;
  [...pic].forEach((c, i) => {
    if (ACTIVE.includes(c)) last = i;
  });
  if (first === -1) {
    throw new Error('FODF1310: picture string contains no digit or decimal separator');
  }
  const prefix = pic.slice(0, first);
  const suffix = pic.slice(last + 1);
  const active = pic.slice(first, last + 1);

  let abs = Math.abs(value);
  if (pic.includes('%')) abs *= 100;
  if (pic.includes('‰')) abs *= 1000;

  const sign = negative && !useNegativePicture ? '-' : '';
  if (!Number.isFinite(abs)) return `${sign}${prefix}Infinity${suffix}`;

  const [intPic, fracPic = ''] = active.split('.');
  const minInt = [...intPic].filter(c => c === '0').length;
  const lastComma = intPic.lastIndexOf(',');
  const groupSize = lastComma === -1 ? 0 : intPic.length - lastComma - 1;
  const minFrac = [...fracPic].filter(c => c === '0').length;
  const maxFrac = [...fracPic].filter(c => c === '0' || c === '#').length;

  const m = 10 ** maxFrac;
  const rounded = roundHalfEven(abs * m) / m;
  let [intStr, fracStr = ''] = rounded.toFixed(maxFrac).split('.');
  while (fracStr.length > minFrac && fracStr.endsWith('0')) fracStr = fracStr.slice(0, -1);

  if (intStr === '0' && minInt === 0) intStr = '';
  intStr = intStr.padStart(minInt, '0');
  if (intStr === '' && fracStr === '') intStr = '0';

  const body = group(intStr, groupSize) + (fracStr ? `.${fracStr}` : '');
  return `${sign}${prefix}${body}${suffix}`;
}
