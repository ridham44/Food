import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { placeOrder } from '@/features/checkout/checkoutApi';
import type { PlaceOrderInput, PlaceOrderResult } from '@/features/checkout/checkoutApi';

/**
 * Wraps POST /order/customer. Deliberately does not clear the cart or
 * navigate on success — the page component owns that sequencing (it needs
 * to fire a toast and route to the order-status page in a specific order).
 */
export function usePlaceOrder() {
  return useMutation<PlaceOrderResult, unknown, PlaceOrderInput>({
    mutationFn: (payload) => placeOrder(payload),
  });
}

export function getCheckoutErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
