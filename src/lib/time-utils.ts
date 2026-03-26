/**
 * Shared time conversion utilities used across server actions.
 */

/** Convert "HH:mm" or "HH:mm:ss" to total minutes since midnight */
export function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

/** Convert total minutes since midnight to "HH:mm" */
export function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

/**
 * Escape LIKE/ILIKE special characters (%, _) to prevent
 * user input from manipulating query patterns.
 */
export function escapeLikePattern(input: string): string {
    return input.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
