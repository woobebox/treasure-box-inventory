// Base-path helpers for GitHub Pages. The app uses logical paths internally
// (`/`, `/add`, `/items/<id>`), but on Pages everything is served under
// import.meta.env.BASE_URL (e.g. `/treasure-box-inventory/`). These convert
// between logical paths and real href/location paths.

const BASE = import.meta.env.BASE_URL; // always ends with '/'

// Logical path (leading '/') -> real href including the base prefix.
export function toHref(logicalPath: string): string {
  const clean = logicalPath.replace(/^\//, '');
  return `${BASE}${clean}`;
}

// Real location pathname -> logical path (strip the base prefix).
export function toLogicalPath(pathname: string): string {
  const baseNoTrailing = BASE.replace(/\/$/, '');
  if (baseNoTrailing && pathname.startsWith(baseNoTrailing)) {
    const rest = pathname.slice(baseNoTrailing.length);
    return rest === '' ? '/' : rest;
  }
  return pathname || '/';
}
