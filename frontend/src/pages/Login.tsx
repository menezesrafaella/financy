import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface LoginFormState {
  email: string;
  password: string;
  isPasswordVisible: boolean;
  errorMessage: string | null;
  isSubmitting: boolean;
  snackbarMessage: string | null;
  snackbarVisible: boolean;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
    isPasswordVisible: false,
    errorMessage: null,
    isSubmitting: false,
    snackbarMessage: null,
    snackbarVisible: false,
  });

  const updateFormField = <K extends keyof LoginFormState>(
    field: K,
    value: LoginFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = () => {
    updateFormField("isPasswordVisible", !formState.isPasswordVisible);
  };

  const handleEmailChange = (email: string) => {
    updateFormField("email", email);
  };

  const handlePasswordChange = (password: string) => {
    updateFormField("password", password);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFormField("errorMessage", null);
    updateFormField("isSubmitting", true);

    try {
      await login(formState.email, formState.password);
      navigate("/");
    } catch (err) {
      updateFormField("errorMessage", (err as Error).message);
    } finally {
      updateFormField("isSubmitting", false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-shell">
        <img src="/assets/Logo.svg" alt="Financy" className="auth-logo" />
        <div className="auth-card">
          <header className="auth-header">
            <h2>Fazer login</h2>
            <p className="muted">Entre na sua conta para continuar</p>
          </header>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="input-group">
              E-mail
              <div className="input-field">
                <img src="/assets/Icon/mail.svg" alt="" aria-hidden="true" />
                <input
                  value={formState.email}
                  onChange={(event) => handleEmailChange(event.target.value)}
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
                  value={formState.password}
                  onChange={(event) => handlePasswordChange(event.target.value)}
                  type={formState.isPasswordVisible ? "text" : "password"}
                  placeholder="Digite sua senha"
                  required
                />
                <button 
                  type="button" 
                  className="icon-button" 
                  aria-label={formState.isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  onClick={togglePasswordVisibility}
                >
                  <img 
                    src={formState.isPasswordVisible ? "/assets/Icon/eye.svg" : "/assets/Icon/eye-closed.svg"} 
                    alt="" 
                    aria-hidden="true" 
                  />
                </button>
              </div>
            </label>
            <div className="auth-row">
              <label className="checkbox">
                <input type="checkbox" />
                Lembrar-me
              </label>
              <button 
                type="button" 
                className="link-button"
              >
                Recuperar senha
              </button>
            </div>
            {formState.errorMessage && <p className="error">{formState.errorMessage}</p>}
            <button className="primary" type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <div className="divider">
            <span>ou</span>
          </div>
          <p className="auth-muted">Ainda não tem uma conta?</p>
          <Link className="secondary-button" to="/register">
            <img src="/assets/Icon/user-round-plus.svg" alt="" aria-hidden="true" />
            Criar conta
          </Link>
        </div>
        {formState.snackbarVisible && (
          <div className="snackbar" role="status" aria-live="polite">
            <p>{formState.snackbarMessage}</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
