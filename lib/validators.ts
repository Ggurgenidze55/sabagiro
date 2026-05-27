import { z } from 'zod';

export const personalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'Personal ID must be 11 digits');

export const registerSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  personalId: personalIdSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().min(9).max(20),
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  personalId: personalIdSchema,
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
  slug: z.string().trim().min(2).max(100).optional(),
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
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});
