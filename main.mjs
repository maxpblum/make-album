import hotReload from './hotReload.mjs';

hotReload('sizing.json', (newText) => {
  console.log(newText);
});

hotReload('sorted_photo_data.json', (newText) => {
  console.log(newText);
});

hotReload('pagination.txt', (newText) => {
  console.log(newText);
});

hotReload('per_photo_styles.css', (newText) => {
  if (!newText) return;
  let styleTag = document.getElementById('per-photo-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'per-photo-styles';
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = newText;
});

const checkOverflow = (el) => {
  var curOverflow = el.style.overflow;
  if (!curOverflow || curOverflow === "visible") el.style.overflow = "hidden";
  var isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;
  el.style.overflow = curOverflow;
  return isOverflowing;
};

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
      const toggleDirection = el => {
        if (!el.className) return;
        el.className = (el.className.indexOf('page-with-columns') !== -1
                       ? el.className.replace('page-with-columns', 'page-with-rows')
                       : el.className.replace('page-with-rows', 'page-with-columns'));
      };
      attachTagNameListener('div', toggleDirection);

      const layout = [];

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

      for (const item of layout) {
        console.log('processing item: ', item);

        if ([ 'rows', 'columns' ].indexOf(item) !== -1) {
          forcedDirection = item;
          continue;
        }

        if (!newPage) newPage = getNewPage();

        if (newPage && (item === 'break')) newPage = getNewPage();

        if (item !== 'break') {
          const maybePhotoEl = document.querySelectorAll('img.' + item);
          if (maybePhotoEl.length !== 1) {
            throw new DOMException('Invalid document.querySelectorAll results for: img.' + item);
          }
          const photoEl = maybePhotoEl[0];
          photoEl.parentNode.removeChild(photoEl);
          console.log('Appending child to: ', newPage);
          newPage.appendChild(photoEl);

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
        }
      }

      if (newPage && newPage.children && newPage.children.length === 0) {
        document.body.removeChild(newPage);
      }
    });
