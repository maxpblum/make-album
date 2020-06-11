import { hotReload, loadOnce } from './hotReload.mjs';
import Renderer from './render.mjs';
import * as domUtil from './domUtil.mjs';

let currentPagination = [];

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

  const outerWidth = unitsToPixels(data.width_units);
  const outerHeight = unitsToPixels(data.height_units);

  // Since width and height in CSS don't include padding or margin, we need to
  // subtract.
  const pageWidth = unitsToPixels(data.width_units) - (2 * pagePadding);
  const pageHeight = unitsToPixels(data.height_units) - (2 * pagePadding);
  const rowHeight = 1.0 * pageHeight / data.rows_per_page - gap;
  const columnWidth = 1.0 * pageWidth / data.columns_per_page - gap;

  const photoMaxWidth = pageWidth - gap;
  const photoMaxHeight = pageHeight - gap;

  styleTag.innerHTML = `
    .outer-page {
      padding: ${pagePadding}px;
      width: ${pageWidth}px;
      height: ${pageHeight}px;
    }
    .page {
      width: ${pageWidth}px;
      height: ${pageHeight}px;
      padding: 0;
    }
    .photo {
      padding: ${photoPadding}px;
      max-width: ${photoMaxWidth}px;
      max-height: ${photoMaxHeight}px;
    }
    .page-with-rows .photo {
      height: ${rowHeight}px;
    }
    .page-with-columns .photo {
      width: ${columnWidth}px;
    }
  `;

  if (currentPagination.length > 0) {
    return Renderer.requestRender(currentPagination);
  }
});

// Create per-photo style tag and hot reload.
hotReload('per_photo_styles.css', (newText) => {
  if (!newText) return;
  domUtil.getOrCreateStyleTag('per-photo-styles').innerHTML = newText;
  if (currentPagination.length > 0) {
    return Renderer.requestRender(currentPagination);
  }
});

// Load and render layout, and hot reload.
hotReload('pagination.txt', (newText, oldText) => {
  const newPagination = newText.trim().split('\n');
  currentPagination = newPagination;
  return Renderer.requestRender(currentPagination);
});

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

window.togglePrintMode = domUtil.togglePrintMode;
