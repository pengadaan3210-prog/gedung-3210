/**
 * Development utility untuk debugging data fetching issues
 * Gunakan di browser console untuk troubleshoot masalah data tidak tampil
 */

/**
 * Check apakah environment variables sudah configured
 */
export function checkEnvironment() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.group('🔧 Environment Check');
  console.log('Project ID:', projectId ? '✅ Configured' : '❌ Missing');
  console.log('Supabase URL:', url ? '✅ Configured' : '❌ Missing');
  console.log('Publishable Key:', key ? '✅ Configured' : '❌ Missing');
  console.groupEnd();

  const isConfigured = projectId && url && key;
  return {
    isConfigured,
    projectId,
    url,
    key,
    message: isConfigured
      ? 'Environment variables OK'
      : 'Missing environment variables - check .env file',
  };
}

/**
 * Test fetch ke Supabase Function
 */
export async function testSheetsFetch(sheetName: string = 'Visualisasi') {
  console.group(`🧪 Testing fetch ${sheetName} sheet`);

  const env = checkEnvironment();
  if (!env.isConfigured) {
    console.error('❌ Environment not configured');
    console.groupEnd();
    return;
  }

  try {
    const projectId = env.projectId;
    const anonKey = env.key;
    const url = `https://${projectId}.supabase.co/functions/v1/get-sheets-data?sheets=${sheetName}`;

    console.log('🌐 Fetching from:', url);
    console.log('⏳ Waiting for response...');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
    });

    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      console.groupEnd();
      return { error: errorText, status: response.status };
    }

    const data = await response.json();
    console.log('✅ Success! Data received:');
    console.table(data);
    console.groupEnd();

    return { success: true, data };
  } catch (error) {
    console.error('❌ Fetch error:', error);
    console.groupEnd();
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * List semua available sheets dan check apakah ada data
 */
export async function checkAllSheets() {
  console.group('📊 Checking All Sheets');

  const sheets = ['Kegiatan', 'Visualisasi', 'Dokumentasi', 'Notulen', 'Foto_Progres'];
  const results: Record<string, any> = {};

  for (const sheet of sheets) {
    try {
      const result = await testSheetsFetch(sheet);
      results[sheet] = result;
      console.log(`${sheet}: ${result.data ? '✅ Data received' : '❌ No data'}`);
    } catch (error) {
      results[sheet] = { error };
      console.log(`${sheet}: ❌ Error`);
    }
  }

  console.groupEnd();
  return results;
}

/**
 * Test Data struktur - check apakah respons sesuai expected format
 */
export async function validateDataStructure() {
  console.group('✔️ Validating Data Structure');

  try {
    const result = await testSheetsFetch('Visualisasi');
    if (!result.data) {
      console.error('No data to validate');
      return;
    }

    const expected = ['id', 'tipe', 'judul', 'deskripsi', 'url', 'kategori', 'urutan'];
    const data = result.data.visualisasi || [];

    if (data.length === 0) {
      console.warn('⚠️ No Visualisasi records found in sheet');
      return;
    }

    const firstRecord = data[0];
    console.log('First record:', firstRecord);

    const missing = expected.filter(field => !(field in firstRecord));
    if (missing.length > 0) {
      console.error('❌ Missing fields:', missing);
    } else {
      console.log('✅ All expected fields present');
    }

    console.groupEnd();
  } catch (error) {
    console.error('Validation error:', error);
  }
}

/**
 * Check React Query state
 * Gunakan di console setelah component mounted
 */
export function checkQueryState(queryClient: any, queryKey: string[]) {
  console.group('📋 React Query State');
  const cache = queryClient.getQueryData(queryKey);
  console.log('Query key:', queryKey);
  console.log('Cache data:', cache);
  console.log('Has data:', cache ? '✅ Yes' : '❌ No');
  console.groupEnd();
}

/**
 * Quick diagnostic - jalankan semua checks sekaligus
 */
export async function runFullDiagnostic() {
  console.group('🔍 FULL DIAGNOSTIC - Visualisasi Data Issues');
  console.log('Timestamp:', new Date().toISOString());
  console.log('---');

  // 1. Check environment
  const env = checkEnvironment();
  if (!env.isConfigured) {
    console.error('🛑 STOP: Environment not configured');
    return;
  }

  // 2. Check specific sheet
  console.log('\n--- Testing Visualisasi Sheet ---\n');
  const sheetResult = await testSheetsFetch('Visualisasi');

  if (sheetResult.error) {
    console.error('🛑 STOP: Cannot fetch Visualisasi sheet');
    console.error('Error:', sheetResult.error);
    return;
  }

  // 3. Validate structure
  console.log('\n--- Validating Structure ---\n');
  await validateDataStructure();

  console.log('\n✅ Diagnostic complete!');
  console.groupEnd();

  return {
    environment: env,
    sheetData: sheetResult,
  };
}

/**
 * Export untuk global console usage
 * Jalankan di browser console: window.sheetsDebug.runFullDiagnostic()
 */
if (typeof window !== 'undefined') {
  (window as any).sheetsDebug = {
    checkEnvironment,
    testSheetsFetch,
    checkAllSheets,
    validateDataStructure,
    checkQueryState,
    runFullDiagnostic,
  };
}
