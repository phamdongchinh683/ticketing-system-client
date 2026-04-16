import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import type {
  DashboardChartSeries,
  DashboardStatsQuery,
  DashboardTimeType,
} from '../../../data/interfaces/dashboard/stats';

const ROW_ARRAY_KEYS = ['data', 'items', 'rows', 'results', 'statistics', 'monthly', 'series'];

const META = new Set(['year', 'month', 'day', 'id', 'label', 'period', 'name', 'date', 'createdat', 'updatedat']);

export const BOOKING_STATUS_KEYS = ['pending', 'paid', 'cancelled', 'expired'] as const;
export const USER_STATUS_KEYS = ['active', 'inactive', 'banned'] as const;
export const USER_ROLE_KEYS = ['admin', 'customer', 'driver'] as const;
export const REVENUE_METHOD_KEYS = ['cash', 'vnpay'] as const;
export const REVENUE_STATUS_KEYS = ['pending', 'success', 'failed', 'refunded'] as const;
export const REVENUE_EXTRA_KEYS = [
  'vnpay',
  'cash',
  'pending',
  'success',
  'failed',
  'refunded',
  'total',
  'amount',
] as const;

/** API returns either a bare array or `{ data: [...] }` of `[period, value]` pairs. */
function getRootArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const d = (raw as Record<string, unknown>)['data'];
    if (Array.isArray(d)) return d;
    for (const k of ROW_ARRAY_KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (Array.isArray(v)) return v;
    }
  }
  return null;
}

/**
 * Parses tuple series: monthly `[month, count]`, yearly `[year, count]`.
 * Returns `[]` for an empty array response, `null` if the payload is not tuple-shaped.
 */
export function tryParseTupleSeries(raw: unknown): [number, number][] | null {
  const arr = getRootArray(raw);
  if (arr === null) return null;
  if (arr.length === 0) return [];
  const first = arr[0];
  if (!Array.isArray(first) || first.length < 2) return null;
  const pairs: [number, number][] = [];
  for (const item of arr) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const a = Number(item[0]);
    const b = Number(item[1]);
    if (Number.isNaN(a) || Number.isNaN(b)) continue;
    pairs.push([a, b]);
  }
  return pairs.length > 0 ? pairs : [];
}

export function extractRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    for (const k of ROW_ARRAY_KEYS) {
      const v = o[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

function stablePeriodKey(row: Record<string, unknown>): string | null {
  const y = row['year'];
  if (y === undefined || y === null) {
    const l = row['label'] ?? row['period'];
    return l != null ? String(l) : null;
  }
  const year = Number(y);
  const month = row['month'];
  if (month !== undefined && month !== null && !Number.isNaN(Number(month))) {
    return `${year}-${String(Number(month)).padStart(2, '0')}`;
  }
  return `${year}-00`;
}

function periodSortKeyFromKey(k: string): number {
  const [y, m] = k.split('-').map(Number);
  return (y || 0) * 12 + (m || 0);
}

export function formatPeriodKeyToLabel(k: string): string {
  const [y, m] = k.split('-');
  const year = Number(y);
  const month = Number(m);
  if (m && m !== '00' && month >= 1 && month <= 12 && !Number.isNaN(year)) {
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
  return y;
}

function periodSortKey(row: Record<string, unknown>): number {
  const y = Number(row['year'] ?? 0);
  const m = Number(row['month'] ?? 0);
  return y * 12 + m;
}

export function formatPeriodLabel(row: Record<string, unknown>): string {
  const k = stablePeriodKey(row);
  return k ? formatPeriodKeyToLabel(k) : String(row['label'] ?? row['name'] ?? '');
}

export function rowsToLabelsAndDatasets(rows: Record<string, unknown>[], metricKeys: string[]): DashboardChartSeries {
  const sorted = [...rows].sort((a, b) => periodSortKey(a) - periodSortKey(b));
  const labels = sorted.map((r) => formatPeriodLabel(r));
  const datasets = metricKeys.map((key) => ({
    label: key,
    data: sorted.map((r) => Number(r[key] ?? 0)),
  }));
  return { labels, datasets };
}

export function tryKnownMetricColumns(
  rows: Record<string, unknown>[],
  keys: readonly string[],
): DashboardChartSeries | null {
  if (!rows.length) return null;
  const present = keys.filter((k) => typeof rows[0][k] === 'number');
  if (!present.length) return null;
  return rowsToLabelsAndDatasets(rows, present);
}

export function tryAutoNumericColumns(rows: Record<string, unknown>[]): DashboardChartSeries | null {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]).filter((k) => !META.has(k.toLowerCase()) && typeof rows[0][k] === 'number');
  if (!keys.length) return null;
  return rowsToLabelsAndDatasets(rows, keys);
}

function pickNumeric(row: Record<string, unknown>): number {
  for (const k of ['count', 'total', 'value', 'amount', 'number', 'bookings', 'users', 'revenue']) {
    if (typeof row[k] === 'number') return row[k] as number;
  }
  const entry = Object.entries(row).find(([k, v]) => !META.has(k.toLowerCase()) && typeof v === 'number');
  return entry ? Number(entry[1]) : 0;
}

export function mergeStatusParts(parts: { label: string; rows: Record<string, unknown>[] }[]): DashboardChartSeries {
  const allKeys = new Set<string>();
  for (const p of parts) {
    for (const row of p.rows) {
      const key = stablePeriodKey(row);
      if (key) allKeys.add(key);
    }
  }
  const periodOrder = [...allKeys].sort((a, b) => periodSortKeyFromKey(a) - periodSortKeyFromKey(b));
  const labels = periodOrder.map((k) => formatPeriodKeyToLabel(k));

  const byStatus = new Map<string, Map<string, number>>();
  for (const p of parts) {
    const m = new Map<string, number>();
    for (const row of p.rows) {
      const key = stablePeriodKey(row);
      if (!key) continue;
      m.set(key, pickNumeric(row));
    }
    byStatus.set(p.label, m);
  }

  const datasets = parts.map((p) => ({
    label: p.label,
    data: periodOrder.map((key) => byStatus.get(p.label)?.get(key) ?? 0),
  }));

  return { labels, datasets };
}

function tuplePeriodKey(timeType: DashboardTimeType, a: number, yearForMonthly: number): string {
  if (timeType === 'monthly') {
    return `${yearForMonthly}-${String(a).padStart(2, '0')}`;
  }
  return `${a}-00`;
}

function labelForTupleKey(timeType: DashboardTimeType, key: string, yearForMonthly: number): string {
  if (timeType === 'monthly') {
    return formatPeriodKeyToLabel(key);
  }
  const [y] = key.split('-');
  return y;
}

/** Single series from `[period, value][]` (month index or year). */
export function tuplesToSingleSeries(
  tuples: [number, number][],
  timeType: DashboardTimeType,
  yearForMonthly: number,
  datasetLabel: string,
): DashboardChartSeries {
  const sorted = [...tuples].sort((x, y) => x[0] - y[0]);
  const keys = sorted.map(([a]) => tuplePeriodKey(timeType, a, yearForMonthly));
  const labels = keys.map((k) => labelForTupleKey(timeType, k, yearForMonthly));
  const data = sorted.map(([, v]) => v);
  return { labels, datasets: [{ label: datasetLabel, data }] };
}

export function mergeTupleParts(
  parts: { label: string; tuples: [number, number][] }[],
  timeType: DashboardTimeType,
  yearForMonthly: number,
): DashboardChartSeries {
  const allKeys = new Set<string>();
  for (const p of parts) {
    for (const [a] of p.tuples) {
      allKeys.add(tuplePeriodKey(timeType, a, yearForMonthly));
    }
  }
  const periodOrder = [...allKeys].sort((x, y) => periodSortKeyFromKey(x) - periodSortKeyFromKey(y));
  const labels = periodOrder.map((k) => labelForTupleKey(timeType, k, yearForMonthly));

  const datasets = parts.map((p) => {
    const m = new Map(p.tuples.map(([a, v]) => [tuplePeriodKey(timeType, a, yearForMonthly), Number(v)]));
    return {
      label: p.label,
      data: periodOrder.map((key) => m.get(key) ?? 0),
    };
  });

  return { labels, datasets };
}

function chartFromLegacyRows(raw: unknown, metricKeys: readonly string[]): DashboardChartSeries | null {
  const rows = extractRows(raw);
  const fromKnown = tryKnownMetricColumns(rows, metricKeys);
  if (fromKnown && rows.length) return fromKnown;
  const auto = tryAutoNumericColumns(rows);
  if (auto && auto.datasets.length && rows.length) return auto;
  return null;
}

function chartFromResponse(
  raw: unknown,
  q: DashboardStatsQuery,
  year: number,
  datasetLabel: string,
  legacyMetricKeys: readonly string[],
): DashboardChartSeries {
  const tuples = tryParseTupleSeries(raw);
  if (tuples !== null) {
    return tuplesToSingleSeries(tuples, q.type, year, datasetLabel);
  }
  const legacy = chartFromLegacyRows(raw, legacyMetricKeys);
  if (legacy) return legacy;
  return { labels: [], datasets: [] };
}

type StatsApi = {
  getDashboardBooking(q: DashboardStatsQuery): Observable<unknown>;
  getDashboardUser(q: DashboardStatsQuery): Observable<unknown>;
  getDashboardRevenue(q: DashboardStatsQuery): Observable<unknown>;
};

function toTuplePart(
  raw: unknown,
  q: DashboardStatsQuery,
  year: number,
  label: string,
): { label: string; tuples: [number, number][] } {
  const tuples = tryParseTupleSeries(raw);
  if (tuples !== null) return { label, tuples };
  return { label, tuples: rowsToTuplesFromRows(extractRows(raw), q.type, year) };
}

function rowsToTuplesFromRows(
  rows: Record<string, unknown>[],
  timeType: DashboardTimeType,
  year: number,
): [number, number][] {
  if (!rows.length) return [];
  return rows
    .map((row) => {
      if (timeType === 'monthly') {
        const m = Number(row['month']);
        const v = pickNumeric(row);
        if (!Number.isNaN(m)) return [m, v] as [number, number];
      } else {
        const y = Number(row['year']);
        const v = pickNumeric(row);
        if (!Number.isNaN(y)) return [y, v] as [number, number];
      }
      return null;
    })
    .filter((x): x is [number, number] => x !== null);
}

export function resolveBookingChartSeries(api: StatsApi, q: DashboardStatsQuery): Observable<DashboardChartSeries> {
  const year = q.year ?? new Date().getFullYear();

  if (q.status) {
    const status = q.status;
    return api.getDashboardBooking(q).pipe(map((raw) => chartFromResponse(raw, q, year, status, BOOKING_STATUS_KEYS)));
  }

  return forkJoin(
    BOOKING_STATUS_KEYS.map((status) =>
      api.getDashboardBooking({ ...q, status }).pipe(map((raw) => toTuplePart(raw, q, year, status))),
    ),
  ).pipe(
    switchMap((parts) => {
      if (parts.some((p) => p.tuples.length > 0)) {
        return of(mergeTupleParts(parts, q.type, year));
      }
      return forkJoin(
        BOOKING_STATUS_KEYS.map((status) =>
          api.getDashboardBooking({ ...q, status }).pipe(map((raw) => ({ label: status, rows: extractRows(raw) }))),
        ),
      ).pipe(map(mergeStatusParts));
    }),
  );
}

export function resolveUserChartSeries(api: StatsApi, q: DashboardStatsQuery): Observable<DashboardChartSeries> {
  const year = q.year ?? new Date().getFullYear();
  const hasStatus = !!q.status;
  const hasRole = !!q.role;

  if (hasStatus && hasRole) {
    return api
      .getDashboardUser(q)
      .pipe(map((raw) => chartFromResponse(raw, q, year, `${q.status} · ${q.role}`, USER_STATUS_KEYS)));
  }

  if (hasStatus && !hasRole) {
    return forkJoin(
      USER_ROLE_KEYS.map((role) =>
        api.getDashboardUser({ ...q, role }).pipe(map((raw) => toTuplePart(raw, q, year, role))),
      ),
    ).pipe(
      switchMap((parts) => {
        if (parts.some((p) => p.tuples.length > 0)) {
          return of(mergeTupleParts(parts, q.type, year));
        }
        return forkJoin(
          USER_ROLE_KEYS.map((role) =>
            api.getDashboardUser({ ...q, role }).pipe(map((raw) => ({ label: role, rows: extractRows(raw) }))),
          ),
        ).pipe(map(mergeStatusParts));
      }),
    );
  }

  if (!hasStatus && hasRole) {
    return forkJoin(
      USER_STATUS_KEYS.map((status) =>
        api.getDashboardUser({ ...q, status }).pipe(map((raw) => toTuplePart(raw, q, year, status))),
      ),
    ).pipe(
      switchMap((parts) => {
        if (parts.some((p) => p.tuples.length > 0)) {
          return of(mergeTupleParts(parts, q.type, year));
        }
        return forkJoin(
          USER_STATUS_KEYS.map((status) =>
            api
              .getDashboardUser({ ...q, role: q.role, status })
              .pipe(map((raw) => ({ label: status, rows: extractRows(raw) }))),
          ),
        ).pipe(map(mergeStatusParts));
      }),
    );
  }

  return api.getDashboardUser(q).pipe(map((raw) => chartFromResponse(raw, q, year, 'Users', USER_STATUS_KEYS)));
}

export function resolveRevenueChartSeries(api: StatsApi, q: DashboardStatsQuery): Observable<DashboardChartSeries> {
  const year = q.year ?? new Date().getFullYear();
  const hasM = !!q.method;
  const hasS = !!q.status;

  if (hasM && hasS) {
    return api
      .getDashboardRevenue(q)
      .pipe(map((raw) => chartFromResponse(raw, q, year, `${q.method} · ${q.status}`, REVENUE_EXTRA_KEYS)));
  }

  if (hasM && !hasS) {
    return forkJoin(
      REVENUE_STATUS_KEYS.map((status) =>
        api.getDashboardRevenue({ ...q, status }).pipe(map((raw) => toTuplePart(raw, q, year, status))),
      ),
    ).pipe(
      switchMap((parts) => {
        if (parts.some((p) => p.tuples.length > 0)) {
          return of(mergeTupleParts(parts, q.type, year));
        }
        return forkJoin(
          REVENUE_STATUS_KEYS.map((status) =>
            api.getDashboardRevenue({ ...q, status }).pipe(map((raw) => ({ label: status, rows: extractRows(raw) }))),
          ),
        ).pipe(map(mergeStatusParts));
      }),
    );
  }

  if (!hasM && hasS) {
    return forkJoin(
      REVENUE_METHOD_KEYS.map((method) =>
        api.getDashboardRevenue({ ...q, method }).pipe(map((raw) => toTuplePart(raw, q, year, method))),
      ),
    ).pipe(
      switchMap((parts) => {
        if (parts.some((p) => p.tuples.length > 0)) {
          return of(mergeTupleParts(parts, q.type, year));
        }
        return forkJoin(
          REVENUE_METHOD_KEYS.map((method) =>
            api.getDashboardRevenue({ ...q, method }).pipe(map((raw) => ({ label: method, rows: extractRows(raw) }))),
          ),
        ).pipe(map(mergeStatusParts));
      }),
    );
  }

  return api.getDashboardRevenue(q).pipe(map((raw) => chartFromResponse(raw, q, year, 'Revenue', REVENUE_EXTRA_KEYS)));
}

/**
 * Grand total of all values in the chart (per period, sums all datasets — correct for stacked series).
 */
export function chartSeriesGrandTotal(chart: DashboardChartSeries): number {
  const n = chart.labels.length;
  if (n === 0 || !chart.datasets.length) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (const ds of chart.datasets) {
      sum += Number(ds.data[i] ?? 0);
    }
  }
  return sum;
}
