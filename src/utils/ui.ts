export class UI {
  private element: HTMLElement;
  private prefixCSS: string;

  constructor(prefixCSS = "mt") {
    this.element = document.createElement("div");
    this.prefixCSS = prefixCSS;
  }

  public mount() {
    this.element.id = `${this.prefixCSS}-modal`;
    this.element.classList.add(this.prefixCSS);
    this.element.classList.add(`${this.prefixCSS}-modal`);

    this.element.innerHTML = `
      <div class="${this.prefixCSS}-modal-content">
        <span class="${this.prefixCSS}-modal-content-close">×</span>
        <div class="${this.prefixCSS}-modal-content-header">
          <img class="${
            this.prefixCSS
          }-modal-content-header-logo" src="${chrome.runtime.getURL(
      "assets/icons/icon.png"
    )}" alt="Mucho texto">
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
        </div>
        <div class="${this.prefixCSS}-modal-content-actions">
          <a href="https://www.buymeacoffee.com/vicenalvaro" target="_blank">
            <img class="mt-buymecoffee" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" />
          </a>
        </div>
      </div>`;

    this.createListeners();

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
    this.getElementContentLoadingText().textContent = text;
  }

  private closeLoading() {
    this.getElementContentLoading().classList.remove(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentLoading().classList.add(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentLoadingText().textContent = "";
  }

  private showResult(text: string) {
    this.getElementContentResult().classList.remove(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentResult().classList.add(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentResultText().textContent = text;
  }

  private closeResult() {
    this.getElementContentResult().classList.remove(
      `${this.prefixCSS}-modal-visible`
    );
    this.getElementContentResult().classList.add(
      `${this.prefixCSS}-modal-hide`
    );
    this.getElementContentResultText().textContent = "";

    this.closeActions();
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
  }

  private handleCloseClick = () => {
    this.closeModal();
  };

  private openModal() {
    this.element.classList.remove("mt-modal-hide");
    this.element.classList.add("mt-modal-visible");
  }

  private closeModal() {
    this.element.classList.remove("mt-modal-visible");
    this.element.classList.add("mt-modal-hide");
  }

  public openModalTitle(data: any) {
    const { title, subtitle, isLink, isSelection } = data;
    this.getElementContentTitle().innerHTML = title;
    this.getElementContentSubTitle().innerHTML = subtitle;

    if (isLink) this.getElementContentTitle().classList.add("link");
    else this.getElementContentTitle().classList.remove("link");

    if (isSelection) this.getElementContentTitle().classList.add("selection");
    else this.getElementContentTitle().classList.remove("selection");

    this.openModal();
  }

  public openModalLoading(text: string) {
    this.closeResult();
    this.showLoading(text);
    this.openModal();
  }

  public openModalText(resumen: string) {
    this.closeLoading();
    this.showResult(resumen);
    this.getElementContentResultText().classList.remove("error");
    this.getElementContentResultText().innerHTML = resumen;
    this.openModal();
  }

  public openModalActions(data: any) {
    console.log("openModalActions", data);
    this.showActions();
  }

  public openModalError(error: string) {
    this.openModalText(error);
    this.getElementContentResultText().classList.add("error");
  }

  private unmount() {
    this.destroyListeners();

    if (this.element.parentNode)
      this.element.parentNode.removeChild(this.element);
  }

  private createListeners() {
    this.getElementContentCloseBtn().addEventListener(
      "click",
      this.handleCloseClick
    );

    // window.addEventListener("click", this.handleCloseClick);
  }

  private destroyListeners() {
    this.getElementContentCloseBtn().removeEventListener(
      "click",
      this.handleCloseClick
    );
    // window.removeEventListener("click", this.handleCloseClick);
  }

  public destroy() {
    this.unmount();
  }

  private getElementContentCloseBtn() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-close`
    )[0];
  }

  private getElementContentLoading() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-loading`
    )[0];
  }

  private getElementContentLoadingText() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-loading-text`
    )[0];
  }

  private getElementContentTitle() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-header-title`
    )[0];
  }

  private getElementContentSubTitle() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-header-subtitle`
    )[0];
  }

  private getElementContentResult() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-result`
    )[0];
  }

  private getElementContentResultText() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-result-text`
    )[0];
  }

  private getElementContentActions() {
    return this.element.getElementsByClassName(
      `${this.prefixCSS}-modal-content-actions`
    )[0];
  }
}
