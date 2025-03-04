/**
 * Date Utilities Module
 *
 * This module provides utility functions for date and number formatting.
 */

/**
 * Returns the current date formatted as DD-MM-YYYY.
 *
 * @returns {string} The formatted date string
 */
export function getformattedDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
}

/**
 * Generates a random number between 1000 and 9999.
 * Ensures the number is at least 4 digits by adding 1000 if necessary.
 *
 * @returns {number} A random 4-digit number
 */
export function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 10000);
  if (randomNumber < 1000) {
    randomNumber += 1000;
  }
  return randomNumber;
}

/**
 * Extracts a 6-digit image ID from a filename.
 * Uses regex to find a 6-digit number sequence in the filename.
 *
 * @param {string} filename - The filename to extract ID from
 * @returns {string | null} The extracted 6-digit ID or null if not found
 */
export function extractImageId(filename: string): string | null {
  const regex = /\b\d{6}\b/;
  const match = filename.match(regex);
  return match ? match[0] : null;
}
