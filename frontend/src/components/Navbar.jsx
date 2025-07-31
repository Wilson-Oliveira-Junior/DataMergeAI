import React from 'react';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>DataMergeAI</h1>
      </div>
      <div className="navbar-menu">
        <a href="#home">Início</a>
        <a href="#features">Recursos</a>
        <a href="#about">Sobre</a>
        <a href="#contact">Contato</a>
      </div>
    </nav>
  );
}