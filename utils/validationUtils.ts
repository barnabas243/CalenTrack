/**
 * Validates whether a given email address is in a correct format.
 *
 * This function uses a regular expression to check if the provided email address follows the standard email format:
 * - It must contain a local part (before the '@' symbol).
 * - It must contain an '@' symbol followed by a domain part.
 * - The domain part must contain at least one '.' symbol with a valid domain name after it.
 *
 * @param {string} email - The email address to validate.
 *
 * @returns {boolean} - Returns `true` if the email address is valid, otherwise returns `false`.
 *
 * @example
 * // Valid email
 * const isValid = isValidEmail('example@domain.com');
 * console.log(isValid); // true
 *
 * @example
 * // Invalid email (missing top-level domain)
 * const isValid = isValidEmail('user@domain');
 * console.log(isValid); // false
 *
 * @example
 * // Invalid email (invalid characters)
 * const isValid = isValidEmail('user@domain,com');
 * console.log(isValid); // false
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
