
const getBaseUrl = () => {
  // 1. Check for manual override in .env
  const meta = import.meta as any;
  const envUrl = meta.env ? meta.env.VITE_API_URL : null;
  if (envUrl) return envUrl;

  // 2. Priority: Manual override in LocalStorage (set via App Settings UI)
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('scm_remote_api_url');
    if (savedUrl) return savedUrl;

    const origin = window.location.origin;
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isCapacitor = !!(window as any).Capacitor;

    // 3. If in browser and NOT localhost, use the current origin
    if (typeof window !== 'undefined' && !isLocalhost && !isCapacitor) {
      return window.location.origin;
    }

    // 4. Default Fallback for APK/Capacitor/Other
    // THIS URL MUST BE THE PUBLIC SHARED URL
    // IF we are in a browser on any origin, use that origin instead of falling back
    if (typeof window !== 'undefined') return window.location.origin;

    return 'https://scm-inspection-app.onrender.com';
  }

  return '';
};

export const getApiUrl = (path: string): string => {
  if (!path) return '';
  
  let cleanPath = path;

  // Fix legacy hardcoded localhost URLs that might be stored in the database
  if (cleanPath.startsWith('http://localhost:5173') || cleanPath.startsWith('http://localhost:3000')) {
    const url = new URL(cleanPath);
    cleanPath = url.pathname;
  }

  // If it's already an absolute URL (including data URIs) and not a localhost one we just fixed
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  // Ensure path starts with /
  const absolutePath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  // If we're in the browser, always use relative paths
  if (typeof window !== 'undefined') {
    return absolutePath;
  }

  // Server-side context (if any)
  const baseUrl = getBaseUrl();
  if (baseUrl) {
    const divider = baseUrl.endsWith('/') ? '' : '/';
    const relativePath = absolutePath.startsWith('/') ? absolutePath.substring(1) : absolutePath;
    return `${baseUrl}${divider}${relativePath}`;
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
