import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SheetsData } from "@/lib/types";

async function fetchSheetsData(sheets?: string[]): Promise<SheetsData> {
  const params = sheets ? `?sheets=${sheets.join(",")}` : "";
  
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const url = `https://${projectId}.supabase.co/functions/v1/get-sheets-data${params}`;
  console.log('Fetching from:', url);
  
  try {
    const res = await fetch(
      url,
      {
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
      }
    );

    console.log('Response status:', res.status);
    console.log('Response headers:', {
      contentType: res.headers.get('content-type'),
      contentLength: res.headers.get('content-length'),
    });

    const text = await res.text();
    console.log('Raw response text:', text.substring(0, 500));

    if (!res.ok) {
      console.error('API Error (status:', res.status, '):', text);
      throw new Error(`Failed to fetch sheets data (${res.status}): ${text.substring(0, 200)}`);
    }

    // Try to parse JSON, with better error handling
    if (!text || text.trim() === '') {
      console.error('Empty response from API');
      throw new Error('Empty response from API');
    }

    const data = JSON.parse(text);
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export function useSheetsData(sheets?: string[]) {
  return useQuery({
    queryKey: ["sheets-data", sheets],
    queryFn: () => fetchSheetsData(sheets),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useKegiatan() {
  const { data, ...rest } = useSheetsData(["Kegiatan"]);
  return { data: data?.kegiatan || [], ...rest };
}

export function useVisualisasi() {
  const { data, error, ...rest } = useSheetsData(["Visualisasi"]);
  return { data: data?.visualisasi || [], error, ...rest };
}

export function useDokumentasi() {
  const { data, ...rest } = useSheetsData(["Dokumentasi"]);
  return { data: data?.dokumentasi || [], ...rest };
}

export function useNotulen() {
  const { data, ...rest } = useSheetsData(["Notulen"]);
  return { data: data?.notulen || [], ...rest };
}

export function useFotoProgres() {
  const { data, ...rest } = useSheetsData(["Foto_Progres"]);
  return { data: data?.fotoProgres || [], ...rest };
}

export function useAllSheetsData() {
  return useSheetsData();
}
