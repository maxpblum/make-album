let waitUntilUnlocked = Promise.resolve();

const loadImpl = (url, taskWhenChanged, reload) => {
  let stored = null;
  let waiting = false;
  const fetchAndUpdate = () => {
    if (waiting) return;
    waiting = true;
    waitUntilUnlocked = waitUntilUnlocked.then(
      fetch(url)
      .then(response => response.text())
      .then(text => {
        if (text !== stored) {
          const old = stored;
          stored = text;
          taskWhenChanged(text, old);
        }
        waiting = false;
      }));
  };
  fetchAndUpdate();
  if (!reload) return;
  return setInterval(fetchAndUpdate, 3000);
};

export const loadOnce = (url, task) => loadImpl(url, task, false);
export const hotReload = (url, task) => loadImpl(url, task, true);
