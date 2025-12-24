/**
 * Ensures an image URL uses HTTPS protocol
 * This fixes mixed content issues when the site is served over HTTPS
 * but images are stored with HTTP URLs
 * 
 * @param {string} url - The image URL (can be HTTP or HTTPS)
 * @returns {string} - The URL with HTTPS protocol
 */
export const ensureHttps = (url) => {
  if (!url) return url;
  
  // If the URL starts with http://, replace it with https://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // If it's already https:// or a relative URL, return as is
  return url;
};

