import { z } from 'zod';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MOBILE_PATTERN = /^[0-9]{8,15}$/;

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or mobile number is required.')
    .refine((value) => EMAIL_PATTERN.test(value) || MOBILE_PATTERN.test(value), {
      message: 'Enter a valid email or mobile number.',
    }),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
