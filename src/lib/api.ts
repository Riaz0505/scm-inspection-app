
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
    if (!isLocalhost && !isCapacitor) return origin;

    // 4. Default Fallback for APK/Capacitor/Other
    // THIS URL MUST BE THE PUBLIC SHARED URL
    return 'https://scm-inspection-app.onrender.com';
  }

  return '';
};

export const getApiUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (baseUrl) {
    const divider = baseUrl.endsWith('/') ? '' : '/';
    return `${baseUrl}${divider}${cleanPath}`;
  }
  
  return `/${cleanPath}`;
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
