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
