import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { userInitials } from "../utils/userDisplay";

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/assets/Logo.svg" alt="Financy" />
        </div>
        <nav className="topbar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Transações
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Categorias
          </NavLink>
        </nav>
        <div className="topbar-actions">
          <NavLink
            to="/profile"
            className={({ isActive }) => `topbar-profile-link${isActive ? " is-active" : ""}`}
            title="Perfil"
            aria-label="Perfil"
          >
            <div className="avatar">{user ? userInitials(user.name) : "U"}</div>
          </NavLink>
        </div>
      </header>
      <main className="content content--no-sidebar">
        <Outlet />
      </main>
    </div>
  );
}
