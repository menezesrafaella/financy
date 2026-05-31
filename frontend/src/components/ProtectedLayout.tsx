import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Login from "../pages/Login";

export default function ProtectedLayout() {
  const { token } = useAuth();
  if (!token) {
    return <Login />;
  }
  return <Outlet />;
}
