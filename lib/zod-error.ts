import { ZodError } from 'zod';

export function zodErrorMessage(error: unknown, fallback = 'Invalid request'): string {
  if (error instanceof ZodError) {
    return error.errors.map((e) => e.message).join('. ');
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
