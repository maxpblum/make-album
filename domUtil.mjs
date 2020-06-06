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

export const toggleDirection = el => {
  if (!el.className) return;
  el.className = (el.className.indexOf('page-with-columns') !== -1
                 ? el.className.replace('page-with-columns', 'page-with-rows')
                 : el.className.replace('page-with-rows', 'page-with-columns'));
};
