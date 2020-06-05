import hotReload from './hotReload.mjs';

const getStyleTag = (tagId) => {
  let styleTag = document.getElementById('per-photo-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = tagId;
    document.head.appendChild(styleTag);
  }
  return styleTag;
};

fetch('sorted_photo_data.json').then(
  response => response.json()
).then(json => {
  console.log('processing photo JSON');
  window.photoMap = {};
  for (const photo of json) {
    window.photoMap[photo.code] = photo;
  }
  console.log('done');
});

hotReload('sizing.json', (newText) => {
  const data = JSON.parse(newText);
  const styleTag = getStyleTag('sizing-styles');

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

hotReload('per_photo_styles.css', (newText) => {
  if (!newText) return;
  getStyleTag('per-photo-styles').innerHTML = newText;
});

hotReload('pagination.txt', (newText) => {
  const pagination = newText.trim().split('\n');
  renderLayout(pagination);
});

const checkOverflow = (el) => {
  var curOverflow = el.style.overflow;
  if (!curOverflow || curOverflow === "visible") el.style.overflow = "hidden";
  var isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;
  el.style.overflow = curOverflow;
  return isOverflowing;
};

const toggleDirection = el => {
  if (!el.className) return;
  el.className = (el.className.indexOf('page-with-columns') !== -1
                 ? el.className.replace('page-with-columns', 'page-with-rows')
                 : el.className.replace('page-with-rows', 'page-with-columns'));
};

const getLoadedPhoto = (url, code, parent) => new Promise(resolve => {
  const photoEl = document.createElement('img');
  photoEl.src = url;
  photoEl.className = `photo ${code}`;
  parent.appendChild(photoEl);
  photoEl.onload = () => resolve(photoEl);
});

const promiseChainFromGetters = getters => {
  let cur = Promise.resolve();
  for (const getter of getters) {
    cur = cur.then(() => getter());
  }
  return cur;
};

function renderLayout(layout) {
  let forcedDirection;
  const getNewPage = () => {
    const page = document.createElement('div');
    const direction = forcedDirection || 'columns';
    page.className = 'page page-with-' + direction;
    if (forcedDirection) {
      page.className += ' direction-forced';
      forcedDirection = undefined;
    }
    document.body.appendChild(page);
    return page;
  };

  let newPage;

  promiseChainFromGetters(layout.map(item => () => {
    console.log('processing item: ', item);

    if ([ 'rows', 'columns' ].indexOf(item) !== -1) {
      forcedDirection = item;
      return;
    }

    if (!newPage) newPage = getNewPage();

    if (newPage && (item === 'break')) newPage = getNewPage();

    if (item !== 'break') {
      return getLoadedPhoto(window.photoMap[item].image_file, item, newPage).then(photoEl => {
        if (checkOverflow(newPage)) {
          const toggleIfUnforced = () => {
            if (newPage.className.indexOf('direction-forced') === -1) {
              toggleDirection(newPage);
            }
          }
          toggleIfUnforced();
          if (checkOverflow(newPage)) {
            toggleIfUnforced();
            newPage.removeChild(photoEl);
            newPage = getNewPage();
            newPage.appendChild(photoEl);
          }
          // if we did not execute the above, switching the flow direction fixed
          // the overflow issue
        }
      });
    }
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
      attachTagNameListener('div', toggleDirection);

    });
