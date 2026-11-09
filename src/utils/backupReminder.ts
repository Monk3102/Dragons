export const LAST_EXPORT_STORAGE_KEY = 'DRACO_ANIMI_LAST_EXPORT';

/**
 * Computes elapsed whole days since the last recorded export timestamp.
 * Returns null if the timestamp is missing, empty, or unparseable.
 * Returns 0 if the timestamp is in the future or within the same day.
 */
export function daysSinceExport(
  lastExportIso: string | null | undefined,
  nowIso?: string
): number | null {
  if (!lastExportIso || typeof lastExportIso !== 'string' || lastExportIso.trim() === '') {
    return null;
  }
  const exportedTime = Date.parse(lastExportIso);
  const nowTime = nowIso ? Date.parse(nowIso) : Date.now();
  if (isNaN(exportedTime) || isNaN(nowTime)) {
    return null;
  }
  const diffMs = nowTime - exportedTime;
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines whether a backup reminder should be shown:
 * - Returns true when there is at least one non-sample monster (nonSampleMonsterCount >= 1)
 *   AND the last export is missing (null/undefined/empty) or older than 14 days (daysSinceExport > 14).
 * - Otherwise returns false.
 */
export function shouldRemind(
  nonSampleMonsterCount: number,
  lastExportIso: string | null | undefined,
  nowIso?: string
): boolean {
  if (nonSampleMonsterCount < 1) {
    return false;
  }

  const days = daysSinceExport(lastExportIso, nowIso);
  if (days === null) {
    return true; // missing last export
  }

  return days > 14;
}

/**
 * Safely retrieves the last export ISO timestamp from browser localStorage.
 */
export function getLastExportTime(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    return window.localStorage.getItem(LAST_EXPORT_STORAGE_KEY);
  } catch (err) {
    console.warn('[backupReminder] Failed to read last export time from localStorage:', err);
    return null;
  }
}

/**
 * Safely saves the last export ISO timestamp into browser localStorage.
 */
export function setLastExportTime(isoString?: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const timestamp = isoString || new Date().toISOString();
    window.localStorage.setItem(LAST_EXPORT_STORAGE_KEY, timestamp);
  } catch (err) {
    console.warn('[backupReminder] Failed to save last export time to localStorage:', err);
  }
}
