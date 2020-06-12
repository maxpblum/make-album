export const getOrCreateStyleTag = (tagId) => {
  let styleTag = document.getElementById(tagId);
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = tagId;
    document.head.appendChild(styleTag);
  }
  return styleTag;
};

export const checkOverflow = (el) => {
  var curOverflow = el.style.overflow;
  if (!curOverflow || curOverflow === "visible") el.style.overflow = "hidden";
  var isOverflowing = el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;
  el.style.overflow = curOverflow;
  return isOverflowing;
};

window.checkOverflow = checkOverflow;

export const toggleDirection = el => {
  if (!el.className) return;
  if (el.className.indexOf('page-with-columns') !== -1) {
    el.className = el.className.replace('page-with-columns', 'page-with-rows')
  } else if (el.className.indexOf('page-with-rows') !== -1) {
    el.className = el.className.replace('page-with-rows', 'page-with-columns');
  }
};

window.toggleDirection = toggleDirection;

export const forceDirection = (pageEl, direction) => {
  if (!pageEl) {
    throw new Error('page must exist to force a direction');
  }
  if (pageEl.className.indexOf(direction) === -1) {
    toggleDirection(pageEl);
  }
  if (pageEl.className.indexOf('direction-forced') === -1) {
    pageEl.className += ' direction-forced';
  }
};

export const getNewPage = () => {
  const page = document.createElement('div');
  page.className = 'outer-page';
  document.body.appendChild(page);
  const pageContent = document.createElement('div');
  pageContent.className = 'page page-with-columns';
  page.appendChild(pageContent);
  return page;
};

export const addPhotoToParent = (url, className, parent) => new Promise(resolve => {
  const photoEl = document.createElement('img');
  photoEl.src = url;
  photoEl.className = `photo ${className}`;
  parent.appendChild(photoEl);
  parent.className += ` ${className}`;
  photoEl.onload = () => resolve(photoEl);
});

export const removePhotoFromParent = (photo, className, parent) => {
  parent.removeChild(photo);
  parent.className = parent.className.replace(` ${className}`, '');
};

export const togglePrintMode = () => {
  if (document.body.className.indexOf('print-mode') === -1) {
    document.body.className += ' print-mode';
  } else {
    document.body.className = document.body.className.replace('print-mode', '');
  }
};

const getOrCreateTopLevelDiv(divId) => {
  const existing = document.getElementById(divId);
  if (existing) return existing;
  const newDiv = document.createElement('div');
  newDiv.id = divId;
  document.body.appendChild(newDiv);
  return newDiv;
};

export const getAlbumRoot = () => getOrCreateTopLevelDiv('album-root');
export const getScratchSpace = () => getOrCreateTopLevelDiv('scratch-space');
