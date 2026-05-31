import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { userInitials } from "../utils/userDisplay";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.name != null) setName(user.name);
  }, [user?.name, user?.id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const trimmed = name.trim();
    if (!trimmed.length) {
      setError("Informe seu nome");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(trimmed);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  const initials = userInitials(user.name);

  return (
    <div className="profile-page">
      <h1 className="visually-hidden">Perfil</h1>
      <div className="profile-card">
        <div className="profile-card__hero">
          <div className="profile-card__avatar profile-card__avatar--large" aria-hidden="true">
            {initials}
          </div>
          <p className="profile-card__title">{user.name}</p>
          <p className="profile-card__subtitle">{user.email}</p>
        </div>

        <div className="profile-card__divider" role="presentation" />

        <form className="profile-card__form" onSubmit={handleSubmit}>
          {error && <p className="profile-card__error">{error}</p>}
          {saved && !error && <p className="profile-card__success">Alterações salvas.</p>}

          <label className="profile-field">
            <span className="profile-field__label">Nome completo</span>
            <div className="profile-field__input-wrap">
              <img src="/assets/Icon/user-round.svg" alt="" aria-hidden="true" className="profile-field__icon" />
              <input
                className="profile-field__input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                autoComplete="name"
                required
              />
            </div>
          </label>

          <label className="profile-field">
            <span className="profile-field__label">E-mail</span>
            <div className="profile-field__input-wrap profile-field__input-wrap--readonly">
              <img src="/assets/Icon/mail.svg" alt="" aria-hidden="true" className="profile-field__icon" />
              <input className="profile-field__input" value={user.email} readOnly tabIndex={-1} aria-readonly="true" />
            </div>
            <span className="profile-field__hint">O e-mail não pode ser alterado</span>
          </label>

          <button type="submit" className="profile-card__save" disabled={loading}>
            {loading ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>

        <button type="button" className="profile-card__logout" onClick={handleLogout}>
          <span className="profile-card__logout-icon" aria-hidden="true" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
