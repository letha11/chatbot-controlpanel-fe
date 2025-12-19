export const config = {
  internalApiKey: import.meta.env.VITE_INTERNAL_API_KEY || '',

  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',

  // Features
  division_enabled: import.meta.env.VITE_DIVISION_ENABLED || false,
}