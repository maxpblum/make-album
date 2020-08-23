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

  // "Margin" here is not a CSS margin, but means "intended gap between the edge
  // of the PDF page and the nearest photo edge". (Padding does all the actual
  // work instead.)
  const margins =
    [data.top_margin_units,
     data.bottom_margin_units,
     data.inner_margin_units,
     data.outer_margin_units].map(unitsToPixels);

  const [topMargin, bottomMargin, innerMargin, outerMargin] = margins;

  const gap = unitsToPixels(data.space_between_photos_units);
  const photoPadding = gap / 2.0;

  const [topPadding, bottomPadding, innerPadding, outerPadding] =
    margins.map(m => m - photoPadding);

  const outerWidth = unitsToPixels(data.width_units);
  const outerHeight = unitsToPixels(data.height_units);

  // Since width and height in CSS don't include padding or margin, we need to
  // subtract.
  const pageWidth = unitsToPixels(data.width_units) - innerPadding - outerPadding;
  const pageHeight = unitsToPixels(data.height_units) - topPadding - bottomPadding;
  const rowHeight = 1.0 * pageHeight / data.rows_per_page - gap;
  const columnWidth = 1.0 * pageWidth / data.columns_per_page - gap;

  const photoMaxWidth = pageWidth - gap;
  const photoMaxHeight = pageHeight - gap;

  const leftPageMarker = (data.first_page_side === 'left') ? 'odd' : 'even';
  // Still alternate, even if the JSON-based decision didn't work correctly.
  const rightPageMarker = (leftPageMarker === 'odd') ? 'even' : 'odd';

  styleTag.innerHTML = `
    .outer-page {
      padding-top: ${topPadding}px;
      padding-bottom: ${bottomPadding}px;
      width: ${pageWidth}px;
      height: ${pageHeight}px;
    }
    .outer-page:nth-child(${leftPageMarker}) {
      padding-left: ${outerPadding}px;
      padding-right: ${innerPadding}px;
    }
    .outer-page:nth-child(${rightPageMarker}) {
      padding-left: ${innerPadding}px;
      padding-right: ${outerPadding}px;
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
      attachTagNameListener('img', domUtil.displayPhotoCode);

    });

window.togglePrintMode = domUtil.togglePrintMode;
