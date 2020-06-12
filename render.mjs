import * as domUtil from './domUtil.mjs';

let ongoingRenderer = null;

export default class Renderer {
  constructor() {
    this.canceled = false;
    this.renderPromise = Promise.resolve();
  }

  async cancel() {
    console.log('starting a cancel');
    this.canceled = true;
    await this.renderPromise;
    console.log('cancel complete');
  }

  async render(pagination) {
    console.log('starting a render');
    this.renderPromise =
      this.renderPromise.then(() => this.renderImpl(pagination));
    await this.renderPromise;
    console.log('render completed or canceled');
  }

  async renderImpl(pagination) {
    let newPage;

    for (const item of pagination) {
      if (this.canceled) break;

      if (!newPage) newPage = domUtil.getNewPage();

      if (item.startsWith('break')) {
        // render a manual tag to find the right spot.
        const debugTag = document.createElement('p');
        debugTag.className = 'debug-tag';
        debugTag.innerHTML = item;
        document.body.appendChild(debugTag);

        newPage = domUtil.getNewPage();
        continue;
      }

      if (item === 'rows' || item === 'columns') {
        domUtil.forceDirection(newPage.children[0], item);
        continue;
      }

      const photoCode = item.split(' ')[0];
      const photoEl = await domUtil.addPhotoToParent(
        window.photoMap[photoCode].image_file,
        item,
        newPage.children[0],
      );

      if (domUtil.checkOverflow(newPage.children[0])) {
        const toggleIfUnforced = () => {
          if (newPage.children[0].className.indexOf('direction-forced') === -1) {
            domUtil.toggleDirection(newPage.children[0]);
          }
        }
        toggleIfUnforced();
        if (domUtil.checkOverflow(newPage.children[0])) {
          toggleIfUnforced();
          domUtil.removePhotoFromParent(photoEl, item, newPage.children[0]);
          newPage = domUtil.getNewPage();
          await domUtil.addPhotoToParent(
            window.photoMap[photoCode].image_file,
            item,
            newPage.children[0],
          );
        }
        // if we did not execute the above, switching the flow direction fixed
        // the overflow issue
      }

      if (newPage && newPage.children && newPage.children.length === 0) {
        document.body.removeChild(newPage);
      }
    }
  }

  static async requestRender(pagination) {
    if (ongoingRenderer) {
      await ongoingRenderer.cancel();
    }
    const renderer = new Renderer();
    ongoingRenderer = renderer;
    await renderer.render(pagination);
    ongoingRenderer = null;
  }
}
