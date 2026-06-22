/**
 * Tiny logger used in place of a real logging library.
 * - `info` / `warn` / `error` emit a tagged message to the browser console.
 * - `api` is called by the axios response interceptor and is the only place
 *   that knows about request timing.
 *
 * Format mirrors what a small server log would look like, so that when we
 * later wire a real logger (e.g. `pino` on the server) the patterns line up.
 */
type Meta = Record<string, unknown> | undefined;

export const logger = {
  info: (msg: string, meta?: Meta): void => {
    if (meta === undefined) console.info(`[INFO] ${msg}`);
    else console.info(`[INFO] ${msg}`, meta);
  },
  warn: (msg: string, meta?: Meta): void => {
    if (meta === undefined) console.warn(`[WARN] ${msg}`);
    else console.warn(`[WARN] ${msg}`, meta);
  },
  error: (msg: string, err?: unknown, meta?: Meta): void => {
    if (meta === undefined) console.error(`[ERROR] ${msg}`, err);
    else console.error(`[ERROR] ${msg}`, err, meta);
  },
  api: (
    method: string,
    url: string,
    status?: number,
    elapsedMs?: number,
  ): void => {
    const statusStr = status === undefined ? 'pending' : String(status);
    const elapsedStr = elapsedMs === undefined ? '?' : `${elapsedMs}ms`;
    console.log(`[API] ${method} ${url} → ${statusStr} (${elapsedStr})`);
  },
};
