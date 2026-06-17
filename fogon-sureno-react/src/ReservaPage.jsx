import React from 'react';
import { Link } from 'react-router-dom';

export const ReservaPage = () => {
  return (
    <main className="cart-page-container">
      <section id="reserva-detalle">
        <h2>Reservar una Mesa</h2>
        <p>Próximamente podrás realizar tus reservas en línea para disfrutar del auténtico sabor del sur.</p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/" className="btn-agregar">Volver al Inicio</Link>
        </div>
      </section>
    </main>
  );
};