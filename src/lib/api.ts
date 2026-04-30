
const getBaseUrl = () => {
  // 1. Check for manual override in .env or localStorage (highest priority)
  const meta = import.meta as any;
  const envUrl = meta.env ? meta.env.VITE_API_URL : null;
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('scm_remote_api_url');
    if (savedUrl) return savedUrl;

    const origin = window.location.origin;
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    // 2. If we're in a browser/webapp, use current origin
    // This handles both the preview URL and any custom domain
    if (origin.startsWith('http')) {
      return origin;
    }

    // 3. Fallback for mobile apps (where origin might be local)
    // Try to guess the server URL from the current window location if available
    return 'https://scm-inspection-app.onrender.com'; // Absolute fallback
  }

  return '';
};

export const getApiUrl = (path: string): string => {
  if (!path) return '';
  
  let cleanPath = path;

  // Fix legacy hardcoded localhost URLs
  if (cleanPath.startsWith('http://localhost:5173') || cleanPath.startsWith('http://localhost:3000')) {
    const url = new URL(cleanPath);
    cleanPath = url.pathname;
  }

  // If it's already an absolute URL or data URI
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  // Ensure path starts with /
  const absolutePath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  // ALWAYS return relative path in browser to let browser handle the origin
  // This is the most robust way for proxying and multi-environment support
  if (typeof window !== 'undefined') {
    return absolutePath;
  }

  // Server-side context fallback
  const baseUrl = getBaseUrl();
  if (baseUrl) {
    const divider = baseUrl.endsWith('/') ? '' : '/';
    const relativePart = absolutePath.startsWith('/') ? absolutePath.substring(1) : absolutePath;
    return `${baseUrl}${divider}${relativePart}`;
  }
  
  return absolutePath;
};

export const fetchApi = async (path: string, options?: RequestInit) => {
  const url = getApiUrl(path);
  console.log(`[API] Fetching: ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to get error text
      const text = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      
      try {
        // If it's valid JSON, it might have a message
        if (text.trim().startsWith('{')) {
          const json = JSON.parse(text);
          errorMessage = json.message || errorMessage;
        }
      } catch (e) {
        // Not JSON, probably HTML error page
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error: any) {
    console.error(`[API] Fetch failed for ${url}:`, error);
    throw error;
  }
};
