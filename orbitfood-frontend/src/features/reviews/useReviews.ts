import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { submitOrderReviews } from '@/features/reviews/reviewsApi';
import type { SubmitReviewsInput } from '@/features/reviews/types';

export function useSubmitReviews() {
  return useMutation({
    mutationFn: (payload: SubmitReviewsInput) => submitOrderReviews(payload),
  });
}

export function getReviewErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
