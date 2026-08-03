
export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', duration = 3000): void => {
  const event = new CustomEvent('toast', { 
    detail: { id: Date.now().toString(), type, message, duration } 
  });
  window.dispatchEvent(event);
};

export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const getCloudinaryUrl = (
  publicId: string,
  cloudName: string,
  options: { width?: number; height?: number; crop?: string; quality?: string; format?: string } = {}
): string => {
  const { width, height, crop = 'fill', quality = 'auto', format = 'jpg' } = options;
  let url = `https://res.cloudinary.com/${cloudName}/image/upload`;
  if (width || height) {
    const size = width && height ? `w_${width},h_${height}` : width ? `w_${width}` : `h_${height}`;
    url += '/' + size;
  }
  url += '/c_' + crop + ',q_' + quality + ',f_' + format + '/' + publicId + '.' + format;
  return url;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const generateId = (prefix: string = 'item'): string => {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};
