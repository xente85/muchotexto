export class UI {
  private element: HTMLElement;
  private elementContent: HTMLElement;
  private elementContentCloseBtn: HTMLElement;
  private elementContentTitle: HTMLElement;
  private elementContentSubTitle: HTMLElement;
  private elementContentText: HTMLElement;
  private elementContentActions: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.elementContent = document.createElement("div");
    this.elementContentCloseBtn = document.createElement("span");
    this.elementContentTitle = document.createElement("h1");
    this.elementContentSubTitle = document.createElement("h2");
    this.elementContentText = document.createElement("p");
    this.elementContentActions = document.createElement("div");
  }

  public mount() {
    this.element.id = "mt-modal";
    this.element.className = "mt-modal";

    this.elementContent.className = `${this.element.className}-content`;
    this.elementContentCloseBtn.className = `${this.elementContent.className}-close`;
    this.elementContentCloseBtn.innerHTML = "&times;";

    const titleContainer = document.createElement("div");
    titleContainer.className = `${this.element.className}-content-title`;
    const logo = document.createElement("img");
    logo.className = `${this.element.className}-content-logo`;
    logo.src = "assets/icons/icon.png";
    logo.alt = "Mucho texto";
    titleContainer.appendChild(logo);

    const titleWrapper = document.createElement("div");
    titleWrapper.appendChild(this.elementContentSubTitle);
    titleWrapper.appendChild(this.elementContentTitle);
    titleContainer.appendChild(titleWrapper);

    this.elementContent.appendChild(this.elementContentCloseBtn);
    this.elementContent.appendChild(titleContainer);
    this.elementContent.appendChild(this.elementContentText);
    this.element.appendChild(this.elementContent);

    this.createListeners();

    document.body.appendChild(this.element);

    return this;
  }

  private loading(text: string) {
    this.elementContentText.textContent = `${text}...`;
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

  public openModalTitle(title: string = "", subtitle: string = "") {
    this.elementContentTitle.innerHTML = title;
    this.elementContentSubTitle.innerHTML = subtitle;
    this.openModal();
  }

  public openModalLoading(text: string) {
    this.loading(text);
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
    this.elementContentCloseBtn.removeEventListener(
      "click",
      this.handleCloseClick
    );
    window.removeEventListener("click", this.handleCloseClick);
  }

  public destroy() {
    this.unmount();
  }
}
