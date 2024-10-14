import styles from "../public/styleShadow.css"; // Importar el CSS como un string

export class UI {
  private element: HTMLElement;
  private elementContent: HTMLElement;
  private eventClose: Event;
  private prefixCSS: string;
  private opened: boolean;
  private speech: SpeechSynthesisUtterance | null;
  private idChat: String;

  constructor(prefixCSS = "mt") {
    this.element = document.createElement("div");
    this.elementContent = document.createElement("div");
    this.eventClose = new Event("closeModal");
    this.prefixCSS = prefixCSS;
    this.opened = false;
    this.speech = "speechSynthesis" in window ? new SpeechSynthesisUtterance() : null;
    this.idChat = "";
  }

  public mount() {
    // Crear el shadow root
    const shadowRoot = this.element.attachShadow({ mode: 'open' });
    
    // Crear el elemento <style>
    const styleElement = document.createElement('style');
  
    // Agregar el CSS en línea o dinámicamente
    styleElement.textContent = `${styles}`;

    // Asignar id y clases al elemento
    this.element.id = `${this.prefixCSS}-modal`;
    this.element.classList.add(this.prefixCSS);
    this.element.classList.add(`${this.prefixCSS}-modal`);

    // Agregar clases al contenido del modal
    this.elementContent.classList.add(`${this.prefixCSS}-modal-content`);

    // Definir el contenido HTML del modal, incluyendo un bloque de estilos dentro del shadow DOM
    this.elementContent.innerHTML = `
      <span class="${this.prefixCSS}-modal-content-close">×</span>
      <div class="${this.prefixCSS}-modal-content-header">
        <img class="${this.prefixCSS}-modal-content-header-logo" src="${chrome.runtime.getURL("assets/icons/icon.png")}" alt="Mucho texto">
        <div class="${this.prefixCSS}-modal-content-header-wrapper-title">
          <h2 class="${this.prefixCSS}-modal-content-header-subtitle"></h2>
          <h1 class="${this.prefixCSS}-modal-content-header-title"></h1>
        </div>
      </div>
      <div class="${this.prefixCSS}-modal-content-main">
        <div class="${this.prefixCSS}-modal-content-loading">
          <div class="${this.prefixCSS}-modal-content-loading-loader">
            <div class="mt-loader"></div>
          </div>
          <p class="${this.prefixCSS}-modal-content-loading-text"></p>
        </div>
        <div class="${this.prefixCSS}-modal-content-result">
          <p class="${this.prefixCSS}-modal-content-result-text"></p>
        </div>
        <div class="${this.prefixCSS}-modal-content-input">
          <form id="${this.prefixCSS}-modal-form" class="${this.prefixCSS}-modal-form" aria-label="Formulario de entrada">
            <input 
              type="text" 
              id="${this.prefixCSS}-input-field" 
              class="${this.prefixCSS}-input-field" 
              placeholder="¿Alguna pregunta?" 
              required
            />
            <button 
              type="submit" 
              class="${this.prefixCSS}-submit-button">
              Enviar
            </button>
          </form>
        </div>
      </div>
      <div class="${this.prefixCSS}-modal-content-actions">
        <div class="${this.prefixCSS}-modal-content-actions-wrapper">
          <div class="${this.prefixCSS}-modal-content-actions-list"></div>
          <div>
            <a href="https://www.buymeacoffee.com/xente" target="_blank">
              <img class="mt-buymecoffee" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" />
            </a>
          </div>
        </div>
      </div>`;

    // Crear los listeners necesarios
    this.createListeners();

    // Adjuntar el contenido al shadow root
    shadowRoot.appendChild(styleElement);
    shadowRoot.appendChild(this.elementContent);
    
    // Finalmente, agregar el modal al cuerpo del documento
    document.body.appendChild(this.element);

    return this;
  }

  private showLoading(text: string) {
    this.getElementContentLoading().classList.remove(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentLoading().classList.add(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentLoadingText().innerHTML = text;
  }

  private closeLoading() {
    this.getElementContentLoading().classList.remove(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentLoading().classList.add(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentLoadingText().innerHTML = "";
  }

  private showResult(text: string, chatHistory?: [] | undefined) {
    this.getElementContentResult().classList.remove(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentResult().classList.add(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentResultText().innerHTML = text;
  }

  private closeResult() {
    this.getElementContentResult().classList.remove(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentResult().classList.add(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentResultText().innerHTML = "";

    this.closeActions();
  }

  private showInput() {
    this.getElementContentInput().classList.remove(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentInput().classList.add(
      `${this.prefixCSS}-modal-visible`
    );
  }

  private closeInput() {
    this.getElementContentInput().classList.remove(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentInput().classList.add(
      `${this.prefixCSS}-modal-hide`
    );
  }

  private showActions() {
    this.getElementContentActions().classList.remove(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentActions().classList.add(
      `${this.prefixCSS}-modal-visible`
    );
  }

  private closeActions() {
    this.getElementContentActions().classList.remove(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentActions().classList.add(
      `${this.prefixCSS}-modal-hide`
    );
    this.removeActions();
  }

  private handleCloseClick = () => {
    this.closeModal();
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.closeModal();
    }
  };

  private handleCloseClickStop = (event: MouseEvent) => {
    if (event) event.stopPropagation();
  };

  private handleSubmit = (event: SubmitEvent) => {
    event.preventDefault(); // Evita el envío predeterminado del formulario

    const inputField = this.getElementContentInputField() as HTMLInputElement;

    if (inputField) {
      const inputValue = inputField.value; // Captura el valor del input
      // console.log("Valor ingresado:", inputValue);

      // Aquí puedes hacer algo con el valor, como enviarlo a tu API
      // Por ejemplo:
      this.sendDataToApi(inputValue);
      
      // Opcional: Limpiar el campo de entrada después de capturarlo
      inputField.value = '';
    }
  };

  // Método para enviar datos a la API
  private sendDataToApi(inputValue: string) {
    // Lógica para enviar el valor a tu API
    chrome.runtime.sendMessage({ action: 'reply', idChat: this.idChat, prompt: inputValue });
  }

  private openModal() {
    this.element.classList.remove("mt-modal-hide");
    this.element.classList.add("mt-modal-visible");
    this.opened = true;
  }

  private closeModal() {
    if (!this.opened) return;

    this.element.classList.remove("mt-modal-visible");
    this.element.classList.add("mt-modal-hide");
    this.closeActions();
    this.closeLoading();
    this.closeResult();
    this.closeInput();
    document.dispatchEvent(this.eventClose);
    this.opened = false;
  }

  public openModalTitle(data: any) {
    const { title, subtitle, isLink, isSelection } = data;

    const maxCaractersTitle = 400;
    if (!isLink && title.length > maxCaractersTitle) {
      const textTruncated = title.substring(0, maxCaractersTitle) + "...";
      this.getElementContentTitle().innerHTML = textTruncated;
    } else {
      this.getElementContentTitle().innerHTML = title;
    }

    this.getElementContentSubTitle().innerHTML = subtitle;

    if (isLink) this.getElementContentTitle().classList.add("link");
    else this.getElementContentTitle().classList.remove("link");

    if (isSelection) this.getElementContentTitle().classList.add("selection");
    else this.getElementContentTitle().classList.remove("selection");

    this.openModal();
  }

  public openModalLoading(text: string) {
    this.closeResult();
    this.closeInput();
    this.showLoading(text);
    this.openModal();
  }

  public openModalText(resumen: string, chatHistory?: [] | undefined, keepActions?: boolean | undefined) {
    this.closeLoading();
    if (!keepActions) this.closeActions();
    this.showResult(resumen, chatHistory);
    this.showInput();
    this.getElementContentResultText().classList.remove(
      `${this.prefixCSS}-error`
    );
    this.openModal();
  }

  public openModalActions(info: any) {
    const { type, data } = info;

    this.idChat = data.idChat;

    if (["article"].includes(type)) {
      const { url } = data;
      this.addActionSpeech();
      this.addActionLink(url, "ir al artículo");
    }
    this.showActions();
  }

  public openModalError(error: string) {
    this.openModalText(error);
    this.getElementContentResultText().classList.add(`${this.prefixCSS}-error`);
  }

  private unmount() {
    this.destroyListeners();

    if (this.element.parentNode)
      this.element.parentNode.removeChild(this.element);
  }

  private createListeners() {
    const form = this.getElementContentForm();
    if (form) {
      form.addEventListener(
        "submit",
        this.handleSubmit
      );
    }

    this.getElementContentCloseBtn().addEventListener(
      "click",
      this.handleCloseClick
    );

    this.elementContent.addEventListener("click", this.handleCloseClickStop);
    window.addEventListener("click", this.handleCloseClick);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private destroyListeners() {
    const form = this.getElementContentForm();

    if (form) {
      form.removeEventListener(
        "submit",
        this.handleSubmit
      );
    }
    
    this.getElementContentCloseBtn().removeEventListener(
      "click",
      this.handleCloseClick
    );

    this.elementContent.removeEventListener("click", this.handleCloseClickStop);
    window.removeEventListener("click", this.handleCloseClick);
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  public destroy() {
    this.unmount();
  }

  private getElementContentCloseBtn() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-close`
    )[0];
  }

  private getElementContentLoading() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-loading`
    )[0];
  }

  private getElementContentLoadingText() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-loading-text`
    )[0];
  }

  private getElementContentTitle() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-header-title`
    )[0];
  }

  private getElementContentSubTitle() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-header-subtitle`
    )[0];
  }

  private getElementContentResult() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-result`
    )[0];
  }

  private getElementContentResultText() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-result-text`
    )[0];
  }

  private getElementContentInput() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-input`
    )[0];
  }

  private getElementContentForm() {
    return this.elementContent.querySelector('form');
    /*
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-form`
    )[0];
    */
  }

  private getElementContentInputField() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-input-field`
    )[0];
  }

  private getElementContentActions() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-actions`
    )[0];
  }

  private getElementContentActionsList() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content-actions-list`
    )[0];
  }

  private getElementContent() {
    return this.elementContent.getElementsByClassName(
      `${this.prefixCSS}-modal-content`
    )[0];
  }

  private addActionLink(url: string, text: string) {
    const link = `<a href="${url}" class="${this.prefixCSS}-modal-content-action-link" target="_blank">${text}</a>`;
    const actionElement = this.htmlStringToElement(link);
    if (actionElement)
      this.getElementContentActionsList().appendChild(actionElement);
  }

  private addActionSpeech() {
    if (!this.speech) return;

    const textoLeer = "leémelo";
    const textoParar = "para de leer";

    const nuevoEnlace = document.createElement("a");
    nuevoEnlace.href = "#";
    nuevoEnlace.textContent = textoLeer;
    nuevoEnlace.classList.add(`${this.prefixCSS}-modal-content-action-link`);
    nuevoEnlace.onclick = () => {
      if (nuevoEnlace.textContent === textoLeer) this.playSpeech();
      if (nuevoEnlace.textContent === textoParar) this.stopSpeech();
    };

    // Evento cuando la síntesis de voz comienza
    this.speech.onstart = () => {
      nuevoEnlace.textContent = textoParar;
    };

    // Evento cuando la síntesis de voz se pausa
    this.speech.onpause = () => {
      nuevoEnlace.textContent = textoLeer;
    };

    this.speech.onend = () => {
      nuevoEnlace.textContent = textoLeer;
    };

    this.speech.onerror = () => {
      nuevoEnlace.textContent = "error de lectura";
    };

    this.getElementContentActionsList().appendChild(nuevoEnlace);
  }

  private playSpeech() {
    if (!this.speech) return;
    this.stopSpeech();

    const text = this.getElementContentResultText().innerHTML;
    this.speech.text = text;
    speechSynthesis.cancel();
    speechSynthesis.speak(this.speech);
  }

  private stopSpeech() {
    if (!this.speech) return;
    speechSynthesis.pause();
  }

  private removeActions() {
    if (this.speech) speechSynthesis.cancel();
    this.getElementContentActionsList().innerHTML = "";
  }

  private htmlStringToElement(htmlString: string) {
    const range = document.createRange();
    const fragment = range.createContextualFragment(htmlString);
    return fragment.firstChild;
  }
}
