export class UI {
  private element: HTMLElement;
  private elementContent: HTMLElement;
  private elementContentCloseBtn: HTMLElement;
  private elementContentText: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.elementContent = document.createElement("div");
    this.elementContentCloseBtn = document.createElement("span");
    this.elementContentText = document.createElement("p");
  }

  public mount() {
    this.element.id = "mt-modal";
    this.element.className = "mt-modal";

    this.elementContent.className = `${this.element.className}-content`;
    this.elementContentCloseBtn.className = `${this.elementContent.className}-close`;
    this.elementContentCloseBtn.innerHTML = "&times;";

    this.elementContent.appendChild(this.elementContentCloseBtn);
    this.elementContent.appendChild(this.elementContentText);
    this.element.appendChild(this.elementContent);

    this.createListeners();

    document.body.appendChild(this.element);

    return this;
  }

  private loading() {
    this.elementContentText.textContent = chrome.i18n.getMessage("uiLoading");
  }

  private createListeners() {
    this.elementContentCloseBtn.addEventListener(
      "click",
      this.handleCloseClick
    );

    window.addEventListener("click", this.handleCloseClick);
  }

  private handleCloseClick = () => {
    this.closeModal();
  };

  private openModal() {
    this.element.style.display = "block";
  }

  private closeModal() {
    this.element.style.display = "none";
  }

  public openModalLoading() {
    this.loading();
    this.openModal();
  }

  public openModalText(resumen: string) {
    // this.elementContentText.textContent = resumen;
    this.elementContentText.innerHTML = resumen;
    this.openModal();
  }

  public openModalError(error: string) {
    this.openModalText(error);
  }

  private unmount() {
    this.destroyListeners();

    if (this.element.parentNode)
      this.element.parentNode.removeChild(this.element);
  }

  private destroyListeners() {
    this.elementContentCloseBtn.onclick = null;
    window.onclick = null;
  }

  public destroy() {
    this.unmount();
  }
}
