function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const url = "http://localhost:3000/";
// const url = "https://muchotexto-api.onrender.com/";

async function getArticle(link: string, controller: AbortController) {
  try {
    const response = await fetch(url + "link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        link,
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const result = await response.json();
      // console.log('result', result);
      return result;
    }
  } catch (err) {
    return { error: `Error: ${err}` };
  }
}

async function getResponseIA(prompt: string, controller: AbortController) {
  try {
    const response = await fetch(url + "prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
      }),
      signal: controller.signal,
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (err) {
    return { error: `Error: ${err}` };
  }
}

async function getResponseIATab(tabIdActive: number, idChat: string, prompt: string, controller: AbortController) {
  return new Promise((resolve, reject) => {
    // Buscar todas las pestañas abiertas con chat.openai.com
    chrome.tabs.query({ url: "*://chatgpt.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        // Encontrar la pestaña con el ID del chat específico
        const chatgptTab = tabs.find(tab => tab.url && tab.url.includes(idChat) || false);
        if (chatgptTab && chatgptTab.id) {
          // Ejecutar el script en la pestaña de ChatGPT
          chrome.tabs.update(chatgptTab.id, { active: true }, () => {
            if (chatgptTab && chatgptTab.id) {
              chrome.scripting.executeScript({
                target: { tabId: chatgptTab.id },
                func: sendMessageToChatGPT,
                args: [prompt]
              }).then((results) => {
                // console.log("results", results);
                chrome.tabs.update(tabIdActive, { active: true });
                if (results && results.length > 0 && results[0].result) {
                  // Resolver la promesa con la respuesta obtenida
                  resolve(results[0].result);
                } else {
                  reject("No result found from the script execution.");
                }
              }).catch((error) => {
                reject(error);
              });
            } else {
              reject("Chat with specified ID not found.");
            }
          }); 
        } else {
          reject("Chat with specified ID not found.");
        }
      } else {
        reject("No ChatGPT tab found.");
      }
    });
  });
}

function sendMessageToChatGPT(message: string) {
  const promptTextarea = document.querySelector('.ProseMirror p.placeholder');
  const messageContainer = document.querySelector('.composer-parent > div');
  const promptContainer = document.querySelector('.composer-parent > div:nth-of-type(2)');

  // console.log("promptTextarea", promptTextarea);
  // console.log("messageContainer", messageContainer);
  // console.log("promptContainer", promptContainer);

  if (!promptTextarea || !messageContainer || !promptContainer) {
    return Promise.reject("Failed to interact with ChatGPT: Elements not found.");
  }

  const initialMessageCount = document.querySelectorAll('article').length;
  // console.log("initialMessageCount", initialMessageCount);

  return new Promise<string>((resolve, reject) => {
    // Inserta el mensaje
    promptTextarea.textContent = message;

    const observerButton = new MutationObserver(() => {
      // Busca el botón de enviar solo después de que se haya actualizado el DOM
      const sendButton = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement;
      // console.log("sendButton", sendButton);
      if (sendButton) sendButton.click();
    });
    observerButton.observe(promptContainer, { childList: true, subtree: true });

    // Observador para detectar la nueva respuesta
    let mutationTimeout: NodeJS.Timeout | null = null;
    const responseObserver = new MutationObserver((r, o) => {

      // Cancelar cualquier timeout previo si llega una nueva mutación
      if (mutationTimeout) clearTimeout(mutationTimeout);

      // Configurar un nuevo timeout de debounce
      mutationTimeout = setTimeout(() => {
        const currentMessageCount = document.querySelectorAll('article').length;
        // console.log("currentMessageCount", { currentMessageCount, initialMessageCount });

        if (currentMessageCount > initialMessageCount) {
          const articleElement = document.querySelectorAll('article')[currentMessageCount - 1];
          // console.log("articleElement", articleElement);
          const responseElement = articleElement.querySelector(".markdown");
          // console.log("responseElement", responseElement);
          if (responseElement) {
            observerButton.disconnect();
            o.disconnect();
            // console.log("responseElement", responseElement.textContent);
            resolve(responseElement.textContent || ''); // Resuelve la promesa con el texto de la respuesta
          } 
        }
      }, 1000); // Esperar 300ms tras la última mutación antes de ejecutar el código
    });
    responseObserver.observe(messageContainer, { childList: true, subtree: true });

    // Timeout para evitar promesas colgadas
    setTimeout(() => {
      if (mutationTimeout) clearTimeout(mutationTimeout);
      observerButton.disconnect();
      responseObserver.disconnect();
      reject("No response detected in time.");
    }, 20000); // Tiempo límite de 10 segundos
  });

  /*
  return new Promise<string>((resolve, reject) => {
    // Inserta el mensaje
    promptTextarea.textContent = message;

    const observer = new MutationObserver(() => {
      // Busca el botón de enviar solo después de que se haya actualizado el DOM
      const sendButton = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement;

      if (sendButton) {
        // Hacer clic en el botón de enviar
        sendButton.click();

        const initialMessageCount = document.querySelectorAll('article').length;
        // console.log("initialMessageCount", initialMessageCount);

        // Observador para detectar la nueva respuesta
        const responseObserver = new MutationObserver((record, observerThis) => {
          const currentMessageCount = document.querySelectorAll('article').length;

          // console.log("currentMessageCount", currentMessageCount);

          if (currentMessageCount > initialMessageCount) {
            const responseElement = document.querySelector('article:last-child .markdown');
            if (responseElement) {
              // console.log("responseElement", responseElement);
              observerThis.disconnect();
              observer.disconnect(); // Desconectar el primer observador
              resolve(responseElement.textContent || ""); // Resuelve la promesa con el texto de la respuesta
            }
          }
        });

        responseObserver.observe(messageContainer, { childList: true, subtree: true });

        // Timeout para evitar promesas colgadas
        setTimeout(() => {
          responseObserver.disconnect();
          observer.disconnect(); // Desconectar el primer observador
          reject("No response detected in time.");
        }, 10000); // Tiempo límite de 10 segundos
      }
    });

    // Observa cambios en el contenedor del mensaje
    observer.observe(promptContainer, { childList: true, subtree: true });
  });
  */
}

export { sleep, getArticle, getResponseIA, getResponseIATab };
