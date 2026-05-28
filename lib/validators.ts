import { z, type ZodError } from 'zod';

/** Zod `.optional()` still validates `""` — treat blank as missing. */
function emptyToUndefined(val: unknown) {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
}

const optionalEventSlugSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(2).max(100).optional(),
);

export function formatValidationError(e: unknown): string {
  if (e && typeof e === 'object' && 'issues' in e) {
    const issues = (e as ZodError).issues;
    return issues
      .map((issue) => {
        const field = issue.path.join('.') || 'field';
        if (field === 'slug') {
          return 'Leave slug empty to auto-generate from title, or enter at least 2 latin characters.';
        }
        return `${field}: ${issue.message}`;
      })
      .join(' · ');
  }
  return e instanceof Error ? e.message : 'Invalid request';
}

export const personalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'Personal ID must be 11 digits');

const socialUrlSchema = z
  .string()
  .trim()
  .min(8)
  .max(300)
  .refine((v) => /^https?:\/\//i.test(v) || v.includes('.'), {
    message: 'Enter a full profile link (https://...)',
  });

export const registerSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  personalId: personalIdSchema,
  facebookUrl: socialUrlSchema,
  instagramUrl: socialUrlSchema,
});

export const ticketTierSchema = z.object({
  label: z.string().trim().max(80).optional(),
  quantity: z.coerce.number().int().min(1).max(10000),
  priceGel: z.coerce.number().int().min(0).max(10000),
});

export const verificationStatusSchema = z.enum(['PENDING', 'VERIFIED', 'REJECTED']);

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(128),
  newPassword: z.string().min(8).max(128),
});

/** Profile edits — identity fields are set at registration only. */
export const profileUpdateSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const adminGenerateSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  personalId: personalIdSchema,
  productSlug: z.string().min(1),
});

export const clubEventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: optionalEventSlugSchema,
  about: z.string().trim().max(6000).optional(),
  imagePath: z.string().trim().max(2048).optional(),
  lineup: z.string().trim().max(300).optional(),
  tag: z.string().trim().max(200).optional(),
  dayLabel: z.string().trim().min(2).max(12),
  dateLabel: z.string().trim().min(2).max(24),
  eventDate: z.string().trim().optional(),
  accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  priceGel: z.coerce.number().int().min(0).max(10000),
  isFeatured: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  tiers: z.array(ticketTierSchema).min(1).max(10).optional(),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().min(1).max(20),
        holders: z
          .array(
            z.object({
              firstName: z.string().trim().min(2).max(80),
              lastName: z.string().trim().min(2).max(80),
              personalId: personalIdSchema,
              email: z.string().trim().email(),
              phone: z.string().trim().min(9).max(20),
            }),
          )
          .max(19)
          .optional(),
      }),
    )
    .min(1),
});

export const ticketPolicySchema = z.object({
  ticketLimitPerEvent: z.coerce.number().int().min(0).max(20),
  freeTicketsEnabled: z.boolean(),
  freeTicketsQuota: z.coerce.number().int().min(0).max(500),
});

export const freeTicketGenerateSchema = z.object({
  productSlug: z.string().min(1),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  personalId: personalIdSchema,
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
});
