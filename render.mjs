import * as dom from './domUtil.mjs';
import ProgressBar from './progress.mjs';

let ongoingRenderer = null;

export default class Renderer {
  constructor(pagination) {
    this.pagination = pagination;
    this.canceled = false;
    this.renderPromise = Promise.resolve();
  }

  async cancel() {
    console.log('starting a cancel');
    this.canceled = true;
    await this.renderPromise;
    console.log('cancel complete');
  }

  async render() {
    this.renderPromise = (async () => {
      await this.renderPromise;
      console.log('starting a render');
      this.clearAllContent();
      await this.loadAllPhotos();
      this.renderImpl();
      console.log('render completed or canceled');
    })();
    await this.renderPromise;
  }

  renderImpl() {
    let newPage;

    for (const item of this.pagination) {
      if (this.canceled) break;

      if (!newPage) newPage = dom.getNewPage();

      if (item.startsWith('break')) {
        // render a manual tag to find the right spot.
        const debugTag = document.createElement('p');
        debugTag.className = 'debug-tag';
        debugTag.innerHTML = item;
        dom.getAlbumRoot().appendChild(debugTag);

        newPage = dom.getNewPage();
        continue;
      }

      if (item === 'rows' || item === 'columns') {
        dom.forceDirection(newPage.children[0], item);
        continue;
      }

      const photoCode = item.split(' ')[0];
      const photoEl = document.querySelectorAll(`.photo.${photoCode}`)[0];
      photoEl.parentNode.removeChild(photoEl);
      newPage.children[0].appendChild(photoEl);

      if (dom.checkOverflow(newPage.children[0])) {
        const toggleIfUnforced = () => {
          if (newPage.children[0].className.indexOf('direction-forced') === -1) {
            dom.toggleDirection(newPage.children[0]);
          }
        }
        toggleIfUnforced();
        if (dom.checkOverflow(newPage.children[0])) {
          toggleIfUnforced();
          dom.removePhotoFromParent(photoEl, item, newPage.children[0]);
          newPage = dom.getNewPage();
          newPage.children[0].appendChild(photoEl);
        }
        // if we did not execute the above, switching the flow direction fixed
        // the overflow issue
      }

      if (newPage && newPage.children && newPage.children.length === 0) {
        dom.getAlbumRoot().removeChild(newPage);
      }
    }
  }

  static async requestRender(pagination) {
    if (ongoingRenderer) {
      await ongoingRenderer.cancel();
    }
    const renderer = new Renderer(pagination);
    ongoingRenderer = renderer;
    await renderer.render();
    ongoingRenderer = null;
  }

  async loadAllPhotos() {
    const bar = new ProgressBar();

    let photosComplete = 0;

    const processItem = async (item) => {
      if (item.startsWith('break') || item === 'rows' || item === 'columns') {
        return;
      }
      const photoCode = item.split(' ')[0];
      if (document.querySelectorAll(`.photo.${photoCode}`).length) {
        return;
      }
      await dom.addPhotoToParent(
        window.photoMap[photoCode].image_file,
        item,
        dom.getScratchSpace(),
      );
      bar.setProgress(100.0 * (++photosComplete) / this.pagination.length);
    };

    await Promise.all(this.pagination.map(processItem));

    bar.destroy();
  }

  async clearAllContent() {
    const pages = document.querySelectorAll('.outer-page');
    for (let i = pages.length - 1; i >= 0; i--) {
      const page = pages[i].children[0];
      for (let j = page.children.length - 1; j >= 0; j--) {
        const photo = page.children[j];
        page.removeChild(photo);
        dom.getScratchSpace().appendChild(photo);
      }
    }
    document.body.removeChild(dom.getAlbumRoot());
  }
}
