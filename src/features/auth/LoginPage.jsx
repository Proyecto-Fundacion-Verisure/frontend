import { useState } from "react";
import LoginForm from './LoginForm';
import logo from "../../assets/images/logo-fundacion-verisure.png";
import backgroundImage from "../../assets/images/login-background.png";

export default function LoginPage() {
  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="login-page__overlay" />

      <div className="login-page__card">
        <div className="login-page__panel login-page__panel--left">
          <img
            src={logo}
            alt="Fundación Verisure"
            className="login-page__logo"
          />

          <h1 className="login-page__hero-title">
            Tu impacto social
            <br />
            comienza aquí.
          </h1>

          <p className="login-page__hero-text">
            Únete a nuestra comunidad de voluntarios y ayuda a construir un
            futuro más seguro y solidario para todos.
          </p>
        </div>

        <div className="login-page__panel login-page__panel--right">
          <div className="login-page__form-wrapper">
            <h2 className="login-page__form-title">
              Accede a tu portal de voluntariado
            </h2>
            <p className="login-page__form-subtitle">
              Inicia sesión con tus credenciales para continuar.
            </p>

            <LoginForm />

            <p className="login-page__register">
              ¿Eres una entidad social y no tienes una cuenta?
              <br />
              <a href="/register" className="login-page__register-link">
                Regístrate
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
