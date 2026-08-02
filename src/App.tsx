import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Visualisasi from "@/pages/Visualisasi";
import KegiatanPage from "@/pages/KegiatanPage";
import Dokumentasi from "@/pages/Dokumentasi";
import Laporan from "@/pages/Laporan";
import NotulenPage from "@/pages/NotulenPage";
import FotoProgresPage from "@/pages/FotoProgresPage";
import StakeholderPage from "@/pages/StakeholderPage";
import MitigasiPage from "@/pages/MitigasiPage";
import KurvaS from "@/pages/KurvaS";
import JadwalMonitoring from "@/pages/JadwalMonitoring";
import SuratPage from "@/pages/SuratPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/visualisasi" element={<Visualisasi />} />
            <Route
              path="/semua"
              element={
                <KegiatanPage
                  penanggungjawab="Semua"
                  title="Semua Dokumen"
                  description="Daftar semua dokumen dari seluruh penanggungjawab"
                />
              }
            />
            <Route
              path="/perancangan"
              element={
                <KegiatanPage
                  penanggungjawab="Konsultan Perancangan"
                  title="Konsultan Perancangan"
                  description="Daftar dokumen yang menjadi tanggung jawab konsultan perancangan"
                />
              }
            />
            <Route
              path="/konstruksi"
              element={
                <KegiatanPage
                  penanggungjawab="Kontraktor Pelaksana"
                  title="Kontraktor Pelaksana"
                  description="Daftar dokumen yang menjadi tanggung jawab kontraktor pelaksana"
                />
              }
            />
            <Route
              path="/pengawas"
              element={
                <KegiatanPage
                  penanggungjawab="Konsultan Pengawas"
                  title="Konsultan Pengawas"
                  description="Daftar dokumen yang menjadi tanggung jawab konsultan pengawas"
                />
              }
            />

            <Route path="/dokumentasi" element={<Dokumentasi />} />
            <Route path="/notulen" element={<NotulenPage />} />
            <Route path="/foto-progres" element={<FotoProgresPage />} />
            <Route path="/stakeholder" element={<StakeholderPage />} />
            <Route path="/mitigasi" element={<MitigasiPage />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="/kurva-s" element={<KurvaS />} />
            <Route path="/jadwal-monitoring" element={<JadwalMonitoring />} />
            <Route path="/surat" element={<SuratPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
