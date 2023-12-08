// Crea el elemento div para el modal principal
const modal = document.createElement("div");
modal.id = "muchoTextoModal";
modal.className = "muchoTextoModal";

// Crea el elemento div para el contenido del modal
const modalContent = document.createElement("div");
modalContent.className = "modal-content";

// Crea el elemento span para el botón de cierre
const closeBtn = document.createElement("span");
closeBtn.className = "close";
closeBtn.innerHTML = "&times;";

// Crea el elemento p para el texto del modal
const modalText = document.createElement("p");
modalText.textContent = "Loading...";

// Añade el botón de cierre y el texto al contenido del modal
modalContent.appendChild(closeBtn);
modalContent.appendChild(modalText);

// Añade el contenido del modal al modal principal
modal.appendChild(modalContent);

// Añade el modal al cuerpo del documento
document.body.appendChild(modal);

// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// When the user clicks on the button, open the modal
function openModal(resumen: string) {
  modalText.textContent = resumen;
  modal.style.display = "block";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function procesarRespuestaGPT(answer: any) {
  switch (answer) {
    case "ERROR": {
      openModal(
        'You need to once visit <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a> and check if the connection is secure. Redirecting...'
      );
      await sleep(3000);
      chrome.tabs.create({ url: "https://chat.openai.com/chat" });
      break;
    }
    case "CLOUDFLARE": {
      openModal(
        'Something went wrong. Are you logged in to <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a>? Try logging out and logging in again.'
      );
      break;
    }
    default: {
      try {
        let res = await answer.split("data:");
        try {
          const detail = JSON.parse(res[0]).detail;
          openModal(detail);
          return;
        } catch (e) {
          try {
            res = res[1].trim();
            if (res === "[DONE]") return;
            answer = JSON.parse(res);
            let final = answer.message.content.parts[0];
            final = final.replace(/\n/g, "<br>");
            openModal(final);
          } catch (e) {}
        }
      } catch (e) {
        openModal("Something went wrong. Please try in a few minutes.");
      }
      break;
    }
  }
}

function launchModalLink(data: any) {
  if (data.error) {
    openModal(data.error);
    return;
  }
  const jsonArticle = {
    titular: data.title,
    noticia: data.description,
  };
  const question = `
    Quiero que me hagas un resumen de no mas de 200 palabras de esta noticia. Pon el foco a lo que se refiere el titular: "${JSON.stringify(
      jsonArticle
    )}"
  `;
  sendChatGPT(question);
}

function launchModalSelection(textoSeleccionado: string) {
  const question = `Resúme este texto a no mas de 200 palabras "${textoSeleccionado}"`;
  sendChatGPT(question);
}

function sendChatGPT(question: any) {
  if (question) {
    const port = chrome.runtime.connect();
    port.postMessage({ question });
    port.onMessage.addListener(async (answer) => procesarRespuestaGPT(answer));
  } else {
    openModal("Sin información");
  }
}

chrome.runtime.onMessage.addListener(async (request) => {
  const { type, data } = request;
  switch (type) {
    case "launchModalLink": {
      launchModalLink(data);
      break;
    }
    case "launchModalSelection": {
      launchModalSelection(data);
      break;
    }
    default: {
      openModal(`Sin información ${request}`);
      break;
    }
  }
});
