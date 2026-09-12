/** Client-side mirror of the backend's per-route limit for tenant frontImage/backImage uploads (see orbitfood-backend/app/routes_controller/tenant/index.js). */
export const RESTAURANT_IMAGE_MAX_SIZE_KB = 50;
export const RESTAURANT_IMAGE_MAX_SIZE_BYTES = RESTAURANT_IMAGE_MAX_SIZE_KB * 1024;
export const RESTAURANT_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';

const RESTAURANT_IMAGE_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/** Returns an error message if `file` fails the restaurant-image type/size policy, or null when it's valid. */
export function validateRestaurantImage(file: File): string | null {
  if (!RESTAURANT_IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return 'Please choose a PNG, JPEG, or WEBP image';
  }
  if (file.size > RESTAURANT_IMAGE_MAX_SIZE_BYTES) {
    return `Image must be ${RESTAURANT_IMAGE_MAX_SIZE_KB}KB or smaller`;
  }
  return null;
}
