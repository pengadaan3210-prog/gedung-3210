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
                  tahapan="Semua"
                  title="Semua Kegiatan"
                  description="Daftar semua kegiatan dari semua penyedia"
                />
              }
            />
            <Route
              path="/bps-kabupaten"
              element={
                <KegiatanPage
                  tahapan="BPS Kabupaten Majalengka"
                  title="BPS Kabupaten Majalengka"
                  description="Daftar kegiatan oleh BPS Kabupaten Majalengka"
                />
              }
            />
            <Route
              path="/perancangan"
              element={
                <KegiatanPage
                  tahapan="Perencanaan"
                  title="Konsultan Perancangan"
                  description="Daftar kegiatan perencanaan oleh konsultan perancang"
                />
              }
            />
            <Route
              path="/konstruksi"
              element={
                <KegiatanPage
                  tahapan="Pelaksanaan"
                  title="Kontraktor Pelaksana"
                  description="Daftar kegiatan pelaksanaan konstruksi oleh kontraktor"
                />
              }
            />
            <Route
              path="/pengawas"
              element={
                <KegiatanPage
                  tahapan="Pengawasan"
                  title="Konsultan Pengawas"
                  description="Daftar kegiatan pengawasan oleh konsultan pengawas"
                />
              }
            />
            <Route path="/dokumentasi" element={<Dokumentasi />} />
            <Route path="/notulen" element={<NotulenPage />} />
            <Route path="/foto-progres" element={<FotoProgresPage />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
