export class UI {
  private element: HTMLElement;
  private elementContent: HTMLElement;
  private eventClose: Event;
  private prefixCSS: string;

  constructor(prefixCSS = "mt") {
    this.element = document.createElement("div");
    this.elementContent = document.createElement("div");
    this.eventClose = new Event("closeModal");
    this.prefixCSS = prefixCSS;
  }

  public mount() {
    this.element.id = `${this.prefixCSS}-modal`;
    this.element.classList.add(this.prefixCSS);
    this.element.classList.add(`${this.prefixCSS}-modal`);

    this.elementContent.classList.add(`${this.prefixCSS}-modal-content`);

    this.elementContent.innerHTML = `
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
        <div class="${this.prefixCSS}-modal-content-actions-wrapper">
          <div class="${this.prefixCSS}-modal-content-actions-list"></div>
          <div>
            <a href="https://www.buymeacoffee.com/vicenalvaro" target="_blank">
              <img class="mt-buymecoffee" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" />
            </a>
          </div>
        </div>
      </div>`;

    this.createListeners();

    this.element.appendChild(this.elementContent);
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

  private showResult(text: string) {
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

  private openModal() {
    this.element.classList.remove("mt-modal-hide");
    this.element.classList.add("mt-modal-visible");
  }

  private closeModal() {
    this.element.classList.remove("mt-modal-visible");
    this.element.classList.add("mt-modal-hide");
    this.closeActions();
    this.closeLoading();
    this.closeResult();
    document.dispatchEvent(this.eventClose);
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
    this.showLoading(text);
    this.openModal();
  }

  public openModalText(resumen: string) {
    this.closeLoading();
    this.closeActions();
    this.showResult(resumen);
    this.getElementContentResultText().classList.remove(
      `${this.prefixCSS}-error`
    );
    this.openModal();
  }

  public openModalActions(info: any) {
    const { type, data } = info;
    if (["article"].includes(type)) {
      const { url } = data;
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
    this.getElementContentCloseBtn().addEventListener(
      "click",
      this.handleCloseClick
    );

    this.elementContent.addEventListener("click", this.handleCloseClickStop);
    window.addEventListener("click", this.handleCloseClick);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private destroyListeners() {
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

  private removeActions() {
    this.getElementContentActionsList().innerHTML = "";
  }

  private htmlStringToElement(htmlString: string) {
    const range = document.createRange();
    const fragment = range.createContextualFragment(htmlString);
    return fragment.firstChild;
  }
}
