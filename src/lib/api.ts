
const getBaseUrl = () => {
  // 1. Check for manual override in .env or localStorage (highest priority)
  const meta = import.meta as any;
  const envUrl = meta.env ? meta.env.VITE_API_URL : null;
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined') {
    // If it's onrender.com, it might be a stale fallback, check if we should override it
    const savedUrl = localStorage.getItem('scm_remote_api_url');
    if (savedUrl && !savedUrl.includes('onrender.com')) return savedUrl;

    const origin = window.location.origin;
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    // If we're in AI Studio or any web environment, the current origin is usually the correct backend
    if (origin.startsWith('http') && !isLocalhost) {
      return origin;
    }

    // If we are on localhost, and scm_remote_api_url is set, prefer that (for remote testing)
    // Otherwise, use localhost.
    if (isLocalhost) {
      return savedUrl || origin;
    }

    // Fallback for mobile apps (where origin might be local) or non-http contexts
    return savedUrl || 'https://scm-inspection-app.onrender.com'; 
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
  
  const fetchOptions: RequestInit = { ...options };
  const headers = new Headers(fetchOptions.headers || {});

  // Automatically stringify JSON body and set Content-Type header if missing
  if (
    fetchOptions.body && 
    typeof fetchOptions.body === 'object' && 
    !(fetchOptions.body instanceof FormData)
  ) {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  } else if (typeof fetchOptions.body === 'string' && (fetchOptions.body.trim().startsWith('{') || fetchOptions.body.trim().startsWith('[')) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  fetchOptions.headers = headers;

  try {
    const response = await fetch(url, fetchOptions);
    
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
