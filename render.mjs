import * as domUtil from './domUtil.mjs';

export default function renderLayout(lastUnchangedPage, changedPagination) {
  const pages = document.body.children;
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i] === lastUnchangedPage) break;
    document.body.removeChild(pages[i]);
  }

  let newPage;

  funcUtil.promisersListToPromiseChain(changedPagination.map(item => () => {

    if (!newPage) newPage = domUtil.getNewPage();

    if (item.startsWith('break')) {
      // render a manual tag to find the right spot.
      const debugTag = document.createElement('p');
      debugTag.className = 'debug-tag';
      debugTag.innerHTML = item;
      document.body.appendChild(debugTag);

      newPage = domUtil.getNewPage();
      return;
    }

    if (item === 'rows' || item === 'columns') {
      domUtil.forceDirection(newPage.children[0], item);
      return;
    }

    const photoCode = item.split(' ')[0];
    return domUtil.addPhotoToParent(
      window.photoMap[photoCode].image_file,
      item,
      newPage.children[0],
    ).then(photoEl => {
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
          return domUtil.addPhotoToParent(
            window.photoMap[photoCode].image_file,
            item,
            newPage.children[0],
          );
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
