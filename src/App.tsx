import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const DataroomListPage = lazy(() => import("@/pages/DataroomListPage"));
const DataroomLayout = lazy(() => import("@/pages/DataroomLayout"));
const BrowserView = lazy(() => import("@/pages/views/BrowserView"));
const ActivityView = lazy(() => import("@/pages/views/ActivityView"));
const AnalyticsView = lazy(() => import("@/pages/views/AnalyticsView"));
const ChecklistView = lazy(() => import("@/pages/views/ChecklistView"));
const SharesView = lazy(() => import("@/pages/views/SharesView"));
const SharePage = lazy(() => import("@/pages/SharePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

/**
 * Routes are scope-first: /starred, /recent and /trash are addresses, not view
 * state, so every view survives a refresh, a back press and a pasted link.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={400}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Suspense fallback={<div className="h-dvh" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<DataroomListPage />} />

              <Route path="/d/:dataroomId" element={<DataroomLayout />}>
                <Route index element={<BrowserView scope="folder" />} />
                <Route path="f/:folderId" element={<BrowserView scope="folder" />} />
                <Route path="starred" element={<BrowserView scope="starred" />} />
                <Route path="recent" element={<BrowserView scope="recent" />} />
                <Route path="trash" element={<BrowserView scope="trash" />} />
                <Route path="checklist" element={<ChecklistView />} />
                <Route path="shares" element={<SharesView />} />
                <Route path="activity" element={<ActivityView />} />
                <Route path="analytics" element={<AnalyticsView />} />
                <Route path="*" element={<Navigate to="." replace />} />
              </Route>

              <Route path="/s/:token" element={<SharePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
