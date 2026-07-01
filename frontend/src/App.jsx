import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Resetpasswordpage";
import TasksPage from "./pages/TasksPage";
import { STORAGE_KEYS } from "./constants/storageKeys";

function ProtectedRoute({ children }) {
  const isLoggedIn =
    window.localStorage.getItem(STORAGE_KEYS.session) === "1" &&
    Boolean(window.localStorage.getItem("token"));

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/events" element={<TasksPage />} />
        <Route path="/" element={<Navigate to="/events" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  );
}

export default App;
