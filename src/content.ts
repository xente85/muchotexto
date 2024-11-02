import { createApp } from 'vue';
import App from './components/App.vue'; // Importa el componente App.vue
import css from "./components/app.css"; // Importar el CSS como un string

// Crear un div para el Shadow DOM
const shadowHost = document.createElement('div');
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
const styleElement = document.createElement('style');
styleElement.textContent = css;

// Crear un contenedor dentro del ShadowRoot
const appContainer = document.createElement('div');

// Añadir el contenedor al ShadowRoot
shadowRoot.appendChild(styleElement);
shadowRoot.appendChild(appContainer);

// Crear la instancia de la aplicación Vue y montarla en el DOM
const app = createApp(App); // Pasa las props aquí

// Montar la aplicación en el contenedor dentro del Shadow DOM
app.mount(appContainer);

// Finalmente, agregar el shadowHost al DOM
document.body.appendChild(shadowHost);

// Seleccionar todos los elementos <a> con la clase "miEnlace"
const enlaces = document.querySelectorAll("a");
enlaces.forEach((enlace) =>  {
  enlace.addEventListener("click", (event) => {
    // Verificar si la tecla Shift está presionada
    if (event.shiftKey) {
      // Evitar el comportamiento predeterminado del enlace
      event.preventDefault();
      chrome.runtime.sendMessage({ message: "link", linkUrl: enlace.href });
    }
  });
});