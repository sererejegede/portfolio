/**
 * Seed data and playback script for the Tailor's Ledger offline-sync demo.
 *
 * Everything here is lifted from the Tailor's Ledger repo rather than invented,
 * so the demo screen shows the product's real vocabulary:
 *
 *   - Field names and their order come from the Men's starter template in
 *     `src/db/seed.ts`. Items render by `position`, which puts Chest (2) before
 *     Sleeve length (5) before Waist (9). Three of the twelve are shown; more
 *     would turn the playback into data entry.
 *   - The client "Tunde Bello" and the set "Wedding agbada" are the example
 *     records in `docs/tailor-app-wireframe.html`.
 *   - The sleeve going 26 1/2 -> 26 3/4 is the worked example in
 *     `docs/tailor-app-data-model.md`: "A tailor re-measures Tunde's Wedding
 *     agbada and only the sleeve got longer".
 *   - Values are canonical decimal inches, displayed as inches-and-fraction at
 *     quarter granularity, matching `app_settings.fraction_granularity`.
 *
 * Source commit: 09916c8 (see tokens.css header).
 */

/** The three fields on the demo screen, in template `position` order. */
export const MEASUREMENT_FIELDS = ['Chest', 'Sleeve length', 'Waist'] as const;

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number];

export const CLIENT = {
  name: 'Tunde Bello',
  phone: '+234 803 555 0142',
  setLabel: 'Wedding agbada',
  templateName: "Men's",
} as const;

/**
 * A record in the append-only `measurement_values` table: one immutable row per
 * value ever taken. Never updated, never deleted - the newest by `recordedAt` is
 * the current value.
 */
export interface SyncRecord {
  id: string;
  field: MeasurementField;
  /** Canonical decimal inches. */
  value: number;
  /**
   * Monotonic sequence, NOT a wall clock. The demo must be deterministic (brief
   * §3) and must not differ between server and client render, so nothing here
   * ever reads `Date.now()`.
   */
  recordedAt: number;
  /** What the row shows as its timestamp. Fixed for seeds, "just now" for new. */
  label: string;
  status: 'synced' | 'pending';
}

/**
 * Three rows already on the device and already pushed, so the screen has a
 * history to insert into before the visitor touches anything.
 */
export const SEED_RECORDS: readonly SyncRecord[] = [
  {
    id: 'seed-3',
    field: 'Waist',
    value: 34,
    recordedAt: 3,
    label: '12 May',
    status: 'synced',
  },
  {
    id: 'seed-2',
    field: 'Sleeve length',
    value: 26.5,
    recordedAt: 2,
    label: '12 May',
    status: 'synced',
  },
  {
    id: 'seed-1',
    field: 'Chest',
    value: 40.5,
    recordedAt: 1,
    label: '12 May',
    status: 'synced',
  },
];

/** First id and sequence number handed out after the seeds. */
export const FIRST_RECORD_SEQ = 4;

/**
 * The re-measure the demo plays back. The visitor does not enter these - the
 * only controls in the demo are the airplane switch and Sync - so the values are
 * fixed rather than derived from taps. Each is a quarter inch up from its seed,
 * which is the granularity the app actually enters.
 *
 * Order follows the template, so the sleeve edit from the data-model doc lands
 * in the middle of the run.
 */
export interface ScriptedEdit {
  field: MeasurementField;
  value: number;
}

export const SCRIPT: readonly ScriptedEdit[] = [
  { field: 'Chest', value: 40.75 },
  { field: 'Sleeve length', value: 26.75 },
  { field: 'Waist', value: 34.25 },
];

/**
 * Inches-and-fraction display. Ported from `fmt()` in the wireframe so the demo
 * renders values exactly as the app does, including the epsilon tolerances.
 */
export function formatInches(value: number | null | undefined): string {
  if (value == null) return '—';
  const whole = Math.floor(value + 1e-9);
  const fractional = value - whole;
  let fraction = '';
  if (Math.abs(fractional - 0.25) < 0.02) fraction = '¼';
  else if (Math.abs(fractional - 0.5) < 0.02) fraction = '½';
  else if (Math.abs(fractional - 0.75) < 0.02) fraction = '¾';
  if (whole === 0 && fraction) return fraction;
  return whole + (fraction ? ` ${fraction}` : '');
}

/** The wireframe suffixes displayed values with a double prime. */
export const INCH_MARK = '″';
