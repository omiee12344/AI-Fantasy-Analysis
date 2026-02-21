// frontend/src/lib/fpl.ts

/**
 * Fetches a map like:
 * { "CHE": "WHU (A)", "WHU": "CHE (H)", ... }
 * from your backend proxy at /api/fpl/opponents
 */
export async function fetchOpponentMapForCurrentGW(): Promise<Record<string, string>> {
  // If you didn't add the Vite proxy, set full URL:
  // const res = await fetch("http://localhost:3000/api/fpl/opponents");
  const res = await fetch("/api/fpl/opponents");

  if (!res.ok) {
    throw new Error(`Proxy failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
