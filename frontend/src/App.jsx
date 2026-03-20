import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TasksPage from "./pages/TasksPage";
import { STORAGE_KEYS } from "./constants/storageKeys";

function App() {
  const isAuthenticated =
    typeof window !== "undefined" &&
    window.localStorage.getItem(STORAGE_KEYS.session) === "1";

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/events" : "/login"} replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/events" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/events" replace /> : <SignupPage />}
      />

      <Route element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />}>
        <Route path="/events" element={<TasksPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/events" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
