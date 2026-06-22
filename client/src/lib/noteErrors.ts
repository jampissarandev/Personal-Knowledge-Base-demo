import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { ApiError } from '@/api/client';
import { logger } from '@/lib/logger';

/** Minimal shape required for error-mapping. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ErrorMappingForm<T extends FieldValues>
  extends Pick<UseFormReturn<T>, 'setError'> {}

/**
 * Server error categories the note / tag / folder mutations surface
 * to the user. Keep in sync with `docs/PHASE6_PLAN.md` §3.7.
 */
export type NoteServerErrorKind =
  | 'VALIDATION_ERROR'
  | 'NOTE_NOT_FOUND'
  | 'FOLDER_NOT_FOUND'
  | 'TAG_NOT_FOUND'
  | 'INVALID_CONTENT_JSON'
  | 'TAG_EXISTS'
  | 'FOLDER_EXISTS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface NoteServerError {
  kind: NoteServerErrorKind;
  message: string;
}

const NETWORK_ERROR_MESSAGE =
  'Unable to reach the server. Check your connection.';
const GENERIC_ERROR_MESSAGE = 'Something went wrong.';
const NOTE_NOT_FOUND_MESSAGE = 'Note not found.';
const FOLDER_NOT_FOUND_MESSAGE = 'Referenced folder not found.';
const TAG_NOT_FOUND_MESSAGE = 'Referenced tag not found.';
const INVALID_CONTENT_JSON_MESSAGE =
  'The note content is malformed. Please try again.';
const TAG_EXISTS_MESSAGE = 'A tag with that name already exists.';
const FOLDER_EXISTS_MESSAGE = 'A folder with that name already exists.';

/** Lower-cases the first character. PascalCase → camelCase. */
function toCamelCase(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toLowerCase() + s.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickFirstMessage(details: unknown, key: string): string | null {
  if (!isRecord(details)) return null;
  const value = details[key];
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value[0];
  return typeof first === 'string' ? first : null;
}

/**
 * Map a server `ApiError` to either:
 *  - field-level RHF errors (when `code === 'VALIDATION_ERROR'` and the
 *    form has a known field — e.g. `title`), and
 *  - a top-level `NoteServerError` (with the user-facing message) for
 *    the caller to render via `toast.error(message)`.
 *
 * `logEvent` is the logger tag (`note_create_failed` etc.) — only the
 * `code` is logged, never the body.
 */
export function mapNoteError<T extends FieldValues>(
  err: unknown,
  form: ErrorMappingForm<T> | null,
  logEvent: string,
): NoteServerError {
  if (!(err instanceof ApiError)) {
    logger.error(logEvent, err);
    return { kind: 'UNKNOWN_ERROR', message: GENERIC_ERROR_MESSAGE };
  }

  if (err.code === 'VALIDATION_ERROR') {
    if (form) {
      const titleMessage = pickFirstMessage(err.details, 'Title');
      if (titleMessage) {
        form.setError('title' as unknown as Path<T>, {
          type: 'server',
          message: titleMessage,
        });
      }
      // ContentJson is intentionally not mapped — TipTap's output is
      // always valid; the only realistic failure is the 262 144-char
      // length cap, which is a server-side error toast.
    }
    return { kind: 'VALIDATION_ERROR', message: '' };
  }

  if (err.code === 'NETWORK_ERROR') {
    logger.warn(logEvent, { code: err.code });
    return { kind: 'NETWORK_ERROR', message: NETWORK_ERROR_MESSAGE };
  }

  if (err.code === 'NOTE_NOT_FOUND') {
    logger.warn(logEvent, { code: err.code });
    return { kind: 'NOTE_NOT_FOUND', message: NOTE_NOT_FOUND_MESSAGE };
  }

  if (err.code === 'FOLDER_NOT_FOUND') {
    logger.warn(logEvent, { code: err.code });
    return { kind: 'FOLDER_NOT_FOUND', message: FOLDER_NOT_FOUND_MESSAGE };
  }

  if (err.code === 'TAG_NOT_FOUND') {
    logger.warn(logEvent, { code: err.code });
    return { kind: 'TAG_NOT_FOUND', message: TAG_NOT_FOUND_MESSAGE };
  }

  if (err.code === 'INVALID_CONTENT_JSON') {
    logger.warn(logEvent, { code: err.code });
    return {
      kind: 'INVALID_CONTENT_JSON',
      message: INVALID_CONTENT_JSON_MESSAGE,
    };
  }

  if (err.code === 'TAG_EXISTS') {
    logger.warn(logEvent, { code: err.code });
    return { kind: 'TAG_EXISTS', message: TAG_EXISTS_MESSAGE };
  }

  if (err.code === 'FOLDER_EXISTS') {
    logger.warn(logEvent, { code: err.code });
    return { kind: 'FOLDER_EXISTS', message: FOLDER_EXISTS_MESSAGE };
  }

  logger.error(logEvent, err, { code: err.code });
  return { kind: 'UNKNOWN_ERROR', message: GENERIC_ERROR_MESSAGE };
}

// Re-export the toCamelCase helper for any future test that needs to
// assert the validation-field mapping.
export { toCamelCase };
