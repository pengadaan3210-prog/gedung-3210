# Testing Checklist - Visualisasi Improvements

Testing plan untuk verify error handling dan debugging improvements sebelum commit.

## 🧪 Test Environment

- **Dev Server**: http://localhost:8080
- **Environment**: Development mode (debug utilities enabled)

---

## 📋 Test Cases

### Test 1: Menu Loading & Error Display
- [ ] Buka browser: http://localhost:8080
- [ ] Navigate ke "Visualisasi Proyek" menu
- [ ] Observe:
  - Loading spinner should appear briefly
  - If error: Error message with details should show
  - If no data: Placeholder with "Tambahkan data di sheet Visualisasi" message

**Expected**: Menu loads correctly, error handling works (if applicable)

---

### Test 2: Browser Console Debugging
- [ ] Press `F12` untuk buka Developer Tools
- [ ] Buka "Console" tab
- [ ] Run command:
  ```javascript
  window.sheetsDebug.runFullDiagnostic()
  ```

**Expected Output**:
```
🔍 FULL DIAGNOSTIC - Visualisasi Data Issues
---
🔧 Environment Check
✅ Project ID: Configured
✅ Supabase URL: Configured 
✅ Publishable Key: Configured
---
🧪 Testing fetch Visualisasi sheet
🌐 Fetching from: https://[PROJECT].supabase.co/functions/v1/...
Status: [HTTP STATUS]
✅ Success! Data received: [DATA]
```

**What to look for**:
- All checks show ✅ or ❌?
- Error message if ❌?
- Response status code?

---

### Test 3: Individual Debug Functions

#### 3a. Check Environment
```javascript
window.sheetsDebug.checkEnvironment()
```
**Expected**: Should show isConfigured = true or false

#### 3b. Test Specific Sheet
```javascript
window.sheetsDebug.testSheetsFetch('Visualisasi')
```
**Expected**: 
- If data exists: Shows data in table
- If error: Shows error message with reason

#### 3c. Check All Sheets
```javascript
window.sheetsDebug.checkAllSheets()
```
**Expected**: Status untuk semua sheets (Kegiatan, Visualisasi, Dokumentasi, dll)

#### 3d. Validate Data Structure
```javascript
window.sheetsDebug.validateDataStructure()
```
**Expected**: Validates required fields match expected format

---

### Test 4: Network Tab Analysis
- [ ] F12 → Network tab
- [ ] Refresh page (Ctrl+R)
- [ ] Cari request ke `get-sheets-data`
- [ ] Inspect response

**Check**:
- Status code: 200 (success) or other?
- Response body: Valid JSON?
- Error message if not 200?

---

### Test 5: React Query State (If applicable)
- [ ] Buka React DevTools extension (if installed)
- [ ] Check React Query state
- [ ] Look for:
  - Query key: `["sheets-data", ["Visualisasi"]]`
  - Data in cache?
  - Error state?

---

## 📊 Scenarios to Test

### Scenario A: Happy Path (Data dari Google Sheets ada)
**Prerequisite**: Google Sheets "Visualisasi" sheet setup dengan data

**Steps**:
1. Jangan ubah apapun, test as-is
2. Observe data tampil di menu

**Expected**: Data dari Google Sheets tampil dengan benar

---

### Scenario B: No Data in Sheet
**Prerequisite**: Google Sheets "Visualisasi" sheet ada tapi kosong

**Steps**:
1. Navigate ke Visualisasi menu
2. Check console: `window.sheetsDebug.testSheetsFetch('Visualisasi')`

**Expected**: 
- UI shows placeholder message
- Console shows 0 records
- No error (data successfully fetched, just empty)

---

### Scenario C: Missing Environment Variables
**Prerequisite**: Hapus atau comment `.env` variables

**Steps**:
1. Comment VITE_SUPABASE_* di .env
2. Refresh halaman
3. Check menu Visualisasi

**Expected**:
- Error state tampil
- Console error: "Missing environment variables: VITE_SUPABASE_..."
- Dev tips visible di error component

---

### Scenario D: Invalid Spreadsheet ID
**Prerequisite**: Edit `supabase/functions/get-sheets-data/index.ts`, ubah SPREADSHEET_ID ke value yang salah

**Steps**:
1. Update SPREADSHEET_ID ke `'INVALID_ID_12345'`
2. Refresh halaman
3. Check menu Visualisasi

**Expected**:
- Error state tampil
- Console shows: "Sheet not found in spreadsheet"
- API returns 404 error

---

### Scenario E: Network Error
**Prerequisite**: Simulate network issue

**Steps**:
1. Open DevTools → Network tab
2. Search filter: `get-sheets-data`
3. Refresh page
4. Right-click request → Block request pattern
5. Observe error handling

**Expected**:
- Error state tampil
- Network error message dalam console
- Retry button functional

---

## ✅ Verification Points

- [ ] All debug utilities available di console
- [ ] Error messages are clear and helpful
- [ ] Error component shows development tips in dev mode
- [ ] No console errors (only info/debug logs)
- [ ] Retry button works and re-fetches data
- [ ] Loading state displays correctly
- [ ] Success state displays data correctly

---

## 🚀 Test Results Summary

After testing, fill ini:

### Environment Setup
- [ ] .env file: ✅ / ❌ Comment issue if failed
- [ ] Dependencies: ✅ / ❌
- [ ] Dev server: ✅ / ❌ / ⚠️ (port issue?)

### Feature Tests
- [ ] Visualisasi menu loads: ✅ / ❌ / ⚠️
- [ ] Error handling works: ✅ / ❌ / ⚠️
- [ ] Debug utilities available: ✅ / ❌ / ⚠️
- [ ] Console logs helpful: ✅ / ❌ / ⚠️

### Issues Found
```
1. [Issue description]
2. [Issue description]
```

### Ready to Commit?
- [ ] All tests pass
- [ ] No blocking issues
- [ ] Ready for GitHub push

---

## 🔗 Links

- Dev Server: http://localhost:8080
- DevTools: F12
- Console Commands: `window.sheetsDebug.*`

---

**Happy testing! 🧪**
