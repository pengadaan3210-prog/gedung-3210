import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const penyediaToTahapan: Record<string, string> = {
  "BPS Kabupaten Majalengka": "BPS Kabupaten Majalengka",
  "Konsultan Perancangan": "Perencanaan",
  "Perencanaan": "Perencanaan",
  "Kontraktor Pelaksana": "Pelaksanaan",
  "Pelaksanaan": "Pelaksanaan",
  "Konsultan Pengawas": "Pengawasan",
  "Pengawasan": "Pengawasan",
};

export function normalizePenyedia(penyedia?: string): string {
  if (!penyedia) return "";
  const key = penyedia.trim();
  if (penyediaToTahapan[key]) return penyediaToTahapan[key];
  const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  return penyediaToTahapan[normalizedKey] || key;
}

// Extract file ID from Google Drive sharing URL
// Supports: /d/{id}/, ?id={id}, /open?id={id}, /file/d/{id}/, etc.
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // Pattern 1: /file/d/{id}/ or /d/{id}/ or /d/{id}/view
  const pattern1 = /\/d\/([a-zA-Z0-9_-]+)/;
  const match1 = url.match(pattern1);
  if (match1?.[1]) return match1[1];

  // Pattern 2: ?id={id}
  const pattern2 = /[?&]id=([a-zA-Z0-9_-]+)/;
  const match2 = url.match(pattern2);
  if (match2?.[1]) return match2[1];

  return null;
}

// Convert Google Drive URL to embed preview URL
// Returns preview URL that can be embedded
export function getGoogleDriveEmbedUrl(url: string): string | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;

  // For videos and documents, use /preview endpoint
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Check if URL is a Google Drive URL
export function isGoogleDriveUrl(url: string): boolean {
  return url && url.includes('drive.google.com');
}

// Get display URL for opening in new tab (for documents)
export function getGoogleDriveViewUrl(url: string): string | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/view`;
}

// Get direct image URL from Google Drive (for image preview)
// Converts sharing link to direct accessible image thumbnail
export function getGoogleDriveImageUrl(url: string): string | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  
  // Use Google Drive's thumbnail endpoint - this works without authentication
  // sz parameter: w400, w500, w1000 etc for different sizes
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}
