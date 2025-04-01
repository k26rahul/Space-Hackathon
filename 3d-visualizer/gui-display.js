export class GuiDisplay {
  constructor(folder) {
    this.element = document.createElement('div');
    this.element.className = `gui-display`;
    folder.__ul.appendChild(this.element);
  }

  update(content) {
    this.element.innerHTML = content;
  }
}
