const html = `<div id="progress-bar" style="
    position: fixed;
    display: flex;
    align-items: center;
    top: 50%;
    left: 0;
    width: 100%;
    height: 30px;
    border-radius: 30px;
    margin: 0;
    padding: 0;
    background-color: black;
    "><div style="
    background-color: white;
    height: 25px;
    margin-left: 2.5px;
    width: 0%;
    transition: width 0.1s;
    border-radius: 25px;
"></div></div>`;

export default class ProgressBar {
  constructor() {
    const initialElement = document.createElement('div');
    document.body.appendChild(initialElement);
    initialElement.outerHTML = html;
    this.progressOuter = document.getElementById('progress-bar');
    this.progressInner = this.progressOuter.children[0];
  }

  setProgress(percentage) {
    this.progressInner.style.width = `${percentage}%`;
  }

  destroy() {
    document.body.removeChild(this.progressOuter);
  }
}
