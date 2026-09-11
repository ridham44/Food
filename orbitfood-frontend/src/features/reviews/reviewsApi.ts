import { customerApiClient } from '@/services/api/customerClient';
import type { SubmitReviewsInput, SubmitReviewsResult } from '@/features/reviews/types';

/** POST /menu-rating — batched: submits every rated line in one call. */
export async function submitOrderReviews(payload: SubmitReviewsInput): Promise<SubmitReviewsResult> {
  const { data } = await customerApiClient.post<SubmitReviewsResult>('/menu-rating', payload);
  return data;
}
