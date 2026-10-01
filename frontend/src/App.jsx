import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster } from "react-hot-toast";

import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import { PageLoader } from "./components/Spinner.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Routines from "./pages/Routines.jsx";
import History from "./pages/History.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    // reducedMotion="user": animations switch off for people who ask for less motion
    <MotionConfig reducedMotion="user">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!rounded-full !border !border-line !bg-panel !text-ink !shadow-card",
          style: { fontSize: 14, fontWeight: 500 },
        }}
      />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="routines" element={<Routines />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </MotionConfig>
  );
}
