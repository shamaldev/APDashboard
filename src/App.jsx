import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import APDashboard from "./pages/APDashboard";
import PrivateRoute from "./PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===== Default Route ===== */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ===== Public Routes ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ===== Protected Routes ===== */}
        <Route element={<PrivateRoute />}>
          <Route path="/ssbi" element={<APDashboard />} />
        </Route>

        {/* ===== 404 fallback (optional) ===== */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
