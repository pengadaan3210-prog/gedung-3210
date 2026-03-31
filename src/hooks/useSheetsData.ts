import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SheetsData } from "@/lib/types";

/**
 * Fetches data from Supabase Functions get-sheets-data endpoint
 * 
 * @param sheets - Optional array of sheet names to fetch specific sheets
 * @returns Promise resolving to SheetsData containing kegiatan, visualisasi, dokumentasi, and notulen data
 * @throws Error if the fetch fails or returns non-OK status
 * 
 * @example
 * const data = await fetchSheetsData(['Kegiatan', 'Dokumentasi']);
 */
async function fetchSheetsData(sheets?: string[]): Promise<SheetsData> {
  const params = sheets ? `?sheets=${sheets.join(",")}` : "";
  
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!projectId || !anonKey) {
    const missingVars = [];
    if (!projectId) missingVars.push('VITE_SUPABASE_PROJECT_ID');
    if (!anonKey) missingVars.push('VITE_SUPABASE_PUBLISHABLE_KEY');
    throw new Error(
      `❌ Missing environment variables: ${missingVars.join(', ')}. Please check your .env file.`
    );
  }

  try {
    const url = `https://${projectId}.supabase.co/functions/v1/get-sheets-data${params}`;
    console.log(`🔗 Fetching from: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
    });

    if (!res.ok) {
      let errorMsg = '';
      let errorDetails = '';
      
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || `HTTP ${res.status}`;
        errorDetails = errorData.details;
      } catch {
        errorMsg = await res.text();
      }

      const statusSpecificMsg = 
        res.status === 401 
          ? '❌ Authentication failed. Check your Supabase credentials in .env'
        : res.status === 404
          ? '❌ Sheets API endpoint not found. Has the Supabase function been deployed?'
        : res.status === 500
          ? `❌ Server error in Sheets API. Check Supabase function logs: ${errorMsg}`
        : `❌ API Error (${res.status}): ${errorMsg}`;

      console.error(statusSpecificMsg);
      if (errorDetails) console.error('Details:', errorDetails);
      
      throw new Error(statusSpecificMsg);
    }

    const data = await res.json();
    console.log('✅ Sheets data fetched successfully:', data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sheets:', error.message);
      throw error;
    }
    throw new Error('❌ An unexpected error occurred while fetching sheets data.');
  }
}


/**
 * Generic hook for fetching sheets data from Supabase Functions
 * 
 * @param sheets - Optional array of sheet names to fetch
 * @returns Query object with data, isLoading, isError, and refetch function
 * 
 * @example
 * const { data, isLoading, isError, refetch } = useSheetsData(['Kegiatan']);
 */
export function useSheetsData(sheets?: string[]) {
  return useQuery({
    queryKey: ["sheets-data", sheets],
    queryFn: () => fetchSheetsData(sheets),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching Kegiatan (Activities) data
 * 
 * @returns Object with kegiatan array and query state (isLoading, isError, refetch)
 * 
 * @example
 * const { data, isLoading, isError } = useKegiatan();
 * // data is an array of Kegiatan objects
 */
export function useKegiatan() {
  const { data, ...rest } = useSheetsData(["Kegiatan"]);
  return { data: data?.kegiatan || [], ...rest };
}

/**
 * Hook for fetching Visualisasi (Visualization) data
 * 
 * @returns Object with visualisasi array and query state
 */
export function useVisualisasi() {
  const { data, ...rest } = useSheetsData(["Visualisasi"]);
  return { data: data?.visualisasi || [], ...rest };
}

/**
 * Hook for fetching Dokumentasi (Documentation) data
 * 
 * @returns Object with dokumentasi array and query state
 */
export function useDokumentasi() {
  const { data, ...rest } = useSheetsData(["Dokumentasi"]);
  return { data: data?.dokumentasi || [], ...rest };
}

/**
 * Hook for fetching Notulen (Meeting Minutes) data
 * 
 * @returns Object with notulen array and query state
 */
export function useNotulen() {
  const { data, ...rest } = useSheetsData(["Notulen"]);
  return { data: data?.notulen || [], ...rest };
}

/**
 * Hook for fetching Foto Progres (Progress Photos) data
 * 
 * @returns Object with fotoProgres array and query state
 */
export function useFotoProgres() {
  const { data, ...rest } = useSheetsData(["Foto_Progres"]);
  return { data: data?.fotoProgres || [], ...rest };
}

/**
 * Hook for fetching all sheets data at once
 * 
 * @returns Object with all sheets data and query state
 * @example
 * const { data } = useAllSheetsData();
 * // data contains: kegiatan, visualisasi, dokumentasi, notulen, fotoProgres
 */
export function useAllSheetsData() {
  return useSheetsData();
}
