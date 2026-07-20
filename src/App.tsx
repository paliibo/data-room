import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const DataroomListPage = lazy(() => import("@/pages/DataroomListPage"));
const DataroomPage = lazy(() => import("@/pages/DataroomPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={400}>
        <BrowserRouter>
          <Suspense fallback={<div className="h-dvh" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<DataroomListPage />} />
              <Route path="/d/:dataroomId" element={<DataroomPage />} />
              <Route path="/d/:dataroomId/f/:folderId" element={<DataroomPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
