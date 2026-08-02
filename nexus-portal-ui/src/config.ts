export const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}/rapair-management/nexus-portal-server/public/api`)
  : 'http://localhost/rapair-management/nexus-portal-server/public/api';

export const SITE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SITE_URL || `${window.location.protocol}//${window.location.host}`)
  : 'http://localhost/rapair-management/nexus-portal-ui';
