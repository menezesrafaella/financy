import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-shell">
          <img src="/assets/Logo.svg" alt="Financy" className="auth-logo" />
          <div className="auth-card">
            <header className="auth-header">
              <h2>Criar conta</h2>
              <p className="muted">Comece a controlar suas finanças ainda hoje</p>
            </header>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="input-group">
                Nome completo
                <div className="input-field">
                  <img src="/assets/Icon/user-round.svg" alt="" aria-hidden="true" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </label>
              <label className="input-group">
                E-mail
                <div className="input-field">
                  <img src="/assets/Icon/mail.svg" alt="" aria-hidden="true" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="mail@exemplo.com"
                    required
                  />
                </div>
              </label>
              <label className="input-group">
                Senha
                <div className="input-field">
                  <img src="/assets/Icon/lock.svg" alt="" aria-hidden="true" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Digite sua senha"
                    required
                  />
                  <button type="button" className="icon-button" aria-label="Mostrar senha">
                    <img src="/assets/Icon/eye-closed.svg" alt="" aria-hidden="true" />
                  </button>
                </div>
              </label>
              <p className="helper">A senha deve ter no mínimo 8 caracteres</p>
              {error && <p className="error">{error}</p>}
              <button className="primary" type="submit" disabled={loading}>
                {loading ? "Criando..." : "Cadastrar"}
              </button>
            </form>
            <div className="divider">
              <span>ou</span>
            </div>
            <p className="auth-muted">Já tem uma conta?</p>
            <Link className="secondary-button" to="/login">
              <img src="/assets/Icon/log-in.svg" alt="" aria-hidden="true" />
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
