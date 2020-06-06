import { hotReload, loadOnce } from './hotReload.mjs';
import * as domUtil from './domUtil.mjs';
import * as funcUtil from './funcUtil.mjs';

// Create photo metadata hash map.
loadOnce('sorted_photo_data.json', (text) => {
  console.log('processing photo JSON');
  const json = JSON.parse(text);
  window.photoMap = {};
  for (const photo of json) {
    window.photoMap[photo.code] = photo;
  }
  console.log('done');
});

// Create layout style tag and hot reload.
hotReload('sizing.json', (newText) => {
  const data = JSON.parse(newText);
  const styleTag = domUtil.getOrCreateStyleTag('sizing-styles');

  const unitsToPixels = units => units * data.pixels_per_unit;

  const pageMargin = unitsToPixels(data.margin_units);
  const gap = unitsToPixels(data.space_between_photos_units);
  const photoPadding = gap / 2.0;
  const pagePadding = pageMargin - photoPadding;

  // Since width and height in CSS don't include padding or margin, we need to
  // subtract.
  const pageWidth = unitsToPixels(data.width_units) - (2 * pagePadding);
  const pageHeight = unitsToPixels(data.height_units) - (2 * pagePadding);
  const rowHeight = 1.0 * pageHeight / data.rows_per_page;
  const columnWidth = 1.0 * pageWidth / data.columns_per_page;

  styleTag.innerHTML = `
    .page {
      padding: ${pagePadding}px;
      width: ${pageWidth}px;
      height: ${pageHeight}px;
    }
    .photo {
      padding: ${photoPadding}px;
    }
    .page-with-rows .photo {
      height: ${rowHeight}px;
    }
    .page-with-columns .photo {
      width: ${columnWidth}px;
    }
  `;
});

// Create per-photo style tag and hot reload.
hotReload('per_photo_styles.css', (newText) => {
  if (!newText) return;
  domUtil.getOrCreateStyleTag('per-photo-styles').innerHTML = newText;
});

// Load and render layout, and hot reload.
hotReload('pagination.txt', (newText, oldText) => {
  const oldPagination = oldText ? oldText.trim().split('\n') : [];
  const newPagination = newText.trim().split('\n');
  const {lastUnchangedPage, changedPagination} = getChangeInfo(oldPagination, newPagination);
  renderLayout(lastUnchangedPage, changedPagination);
});

function getChangeInfo(oldPagination, newPagination) {
  return {
    lastUnchangedPage: null,
    changedPagination: newPagination,
  };
}

const getLoadedPhoto = (url, code, parent) => new Promise(resolve => {
  const photoEl = document.createElement('img');
  photoEl.src = url;
  photoEl.className = `photo ${code}`;
  parent.appendChild(photoEl);
  photoEl.onload = () => resolve(photoEl);
});

function renderLayout(lastUnchangedPage, changedPagination) {
  const pages = document.body.children;
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i] === lastUnchangedPage) break;
    document.body.removeChild(pages[i]);
  }

  const getNewPage = () => {
    const page = document.createElement('div');
    page.className = 'page page-with-columns';
    document.body.appendChild(page);
    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    page.appendChild(pageContent);
    return page;
  };

  let newPage;

  funcUtil.promisersListToPromiseChain(changedPagination.map(item => () => {
    console.log('processing item: ', item);

    if (!newPage) newPage = getNewPage();

    if (item.startsWith('break')) {
      // render a manual tag to find the right spot.
      const debugTag = document.createElement('p');
      debugTag.className = 'debugTag';
      debugTag.innerHTML = item;
      document.body.appendChild(debugTag);

      newPage = getNewPage();
      return;
    }

    if (item === 'rows' || item === 'columns') {
      domUtil.forceDirection(newPage, item);
      return;
    }

    newPage.className += ` ${item}`;
    const photoCode = item.split(' ')[0];
    return getLoadedPhoto(window.photoMap[photoCode].image_file, item, newPage.children[0]).then(photoEl => {
      if (domUtil.checkOverflow(newPage)) {
        const toggleIfUnforced = () => {
          if (newPage.className.indexOf('direction-forced') === -1) {
            domUtil.toggleDirection(newPage);
          }
        }
        toggleIfUnforced();
        if (domUtil.checkOverflow(newPage)) {
          toggleIfUnforced();
          newPage.children[0].removeChild(photoEl);
          newPage = getNewPage();
          newPage.children[0].appendChild(photoEl);
        }
        // if we did not execute the above, switching the flow direction fixed
        // the overflow issue
      }
    });
  })).then(() => {
    if (newPage && newPage.children && newPage.children.length === 0) {
      document.body.removeChild(newPage);
    }
  });
}

window.addEventListener(
    'load', (event) => {
      console.log('page is fully loaded');
      const attachTagNameListener = (tagName, listener) => {
        const wrappedListener = ev => {
          const el = ev.target;
          if (el.tagName.toLowerCase() === tagName.toLowerCase()) {
            listener(el);
          }
        };
        document.addEventListener('click', wrappedListener);
      }

      // Attach direction toggle listener
      attachTagNameListener('div', domUtil.toggleDirection);

    });
