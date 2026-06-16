// Arreglo de platos típicos - Menú "Fogón Sureño"
const menuPlatos = [
  {
    id: 1,
    nombre: "Curanto en Olla (Pulmay)",
    descripcion: "Tradicional preparación chilota con mariscos, carnes ahumadas, longaniza, papas, milcaos y chapaleles cooked al vapor.",
    precio: 14500,
    imagen: "assets/img/curanto.png",
    categoria: "carnes-mariscos" // Nos servirá para el hito de los filtros
  },
  {
    id: 2,
    nombre: "Asado de Tira al Palo",
    descripcion: "Corte de carne premium asado lentamente a la leña, tierno y jugoso, acompañado de papas doradas y pebre.",
    precio: 16900,
    imagen: "assets/img/asado.png",
    categoria: "carnes"
  },
  {
    id: 3,
    nombre: "Kuchen de Murta y Crema",
    descripcion: "Clásica receta de la repostería colona alemana con murtilla silvestre del sur y una suave crema horneada.",
    precio: 4500,
    imagen: "assets/img/kuchen.png",
    categoria: "postres"
  },
  {
    id: 4,
    nombre: "Salmón Cancato Sureño",
    descripcion: "Filete de salmón fresco al horno, relleno con queso mantecoso, tomate y longaniza laminada, sazonado con orégano.",
    precio: 13200,
    imagen: "assets/img/salmon.png",
    categoria: "mariscos"
  },
  {
    id: 5,
    nombre: "Cordero al Palo",
    descripcion: "Crujiente y jugoso cordero magallánico asado lentamente al calor de las brasas, servido con papas rústicas y pebre.",
    precio: 18500,
    imagen: "assets/img/cordero.png",
    categoria: "carnes"
  },
  {
    id: 6,
    nombre: "Cazuela de Vacuno",
    descripcion: "Sustancioso caldo casero con trozo de tapa de pecho, zapallo, choclo, papas y arroz, sazonado con cilantro fresco.",
    precio: 11200,
    imagen: "assets/img/cazuela.png",
    categoria: "carnes"
  },
  {
    id: 7,
    nombre: "Paila Marina",
    descripcion: "Concentrado caldo de mariscos y pescados de la zona, servido en paila de greda para mantener todo su calor y sabor.",
    precio: 13900,
    imagen: "assets/img/paila-marina.png",
    categoria: "mariscos"
  },
  {
    id: 8,
    nombre: "Mote con Huesillo",
    descripcion: "Refrescante postre tradicional de duraznos deshidratados cocidos en almíbar de canela, servido con mote de trigo bien helado.",
    precio: 3900,
    imagen: "assets/img/mote.png",
    categoria: "postres"
  }
];

// Estado de la aplicación: Favoritos persistentes
let favoritos = JSON.parse(localStorage.getItem('favoritos-fogon')) || [];

// Función para renderizar los platos en el HTML
const renderizarMenu = (platos) => {
  const contenedor = document.getElementById("contenedor-menu");
  if (!contenedor) return;

  if (platos.length === 0) {
    contenedor.innerHTML = `<p style="grid-column: 1/-1; color: var(--neutro-gris);">No se encontraron platos que coincidan.</p>`;
    return;
  }

  contenedor.innerHTML = platos.map(plato => {
    const esFav = favoritos.includes(plato.id) ? 'activo' : '';
    return `
      <article class="plato">
        <div class="plato-header">
          <h3>${plato.nombre}</h3>
          <button class="btn-favorito ${esFav}" data-id="${plato.id}" title="Agregar a favoritos">❤</button>
        </div>
        <p>${plato.descripcion}</p>
        <p><strong>Precio: $${plato.precio.toLocaleString('es-CL')}</strong></p>
      </article>
    `;
  }).join('');
};

// Lógica unificada de filtrado y búsqueda
const aplicarFiltros = () => {
  const textoBusqueda = document.getElementById("busqueda-input").value.toLowerCase();
  const botonActivo = document.querySelector(".btn-filtro.activo");
  const categoria = botonActivo ? botonActivo.dataset.categoria : "todos";

  const platosFiltrados = menuPlatos.filter(plato => {
    const coincideTexto = plato.nombre.toLowerCase().includes(textoBusqueda) || 
                          plato.descripcion.toLowerCase().includes(textoBusqueda);
    
    let coincideCategoria = false;
    if (categoria === "todos") coincideCategoria = true;
    else if (categoria === "favoritos") coincideCategoria = favoritos.includes(plato.id);
    else coincideCategoria = plato.categoria.includes(categoria);

    return coincideTexto && coincideCategoria;
  });

  renderizarMenu(platosFiltrados);
};

const inicializarEventos = () => {
  // Eventos para botones de categoría
  const botones = document.querySelectorAll(".btn-filtro");
  botones.forEach(boton => {
    boton.addEventListener("click", (e) => {
      botones.forEach(b => b.classList.remove("activo"));
      e.target.classList.add("activo");
      aplicarFiltros();
    });
  });

  // Evento para búsqueda en tiempo real
  document.getElementById("busqueda-input").addEventListener("input", aplicarFiltros);

  // Delegación de eventos para los corazones de favoritos
  document.getElementById("contenedor-menu").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-favorito")) {
      const id = parseInt(e.target.dataset.id);
      favoritos = favoritos.includes(id) ? favoritos.filter(f => f !== id) : [...favoritos, id];
      localStorage.setItem('favoritos-fogon', JSON.stringify(favoritos));
      aplicarFiltros(); // Re-renderiza para mostrar cambios
    }
  });
};

// Ejecutar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  renderizarMenu(menuPlatos);
  inicializarEventos();
});