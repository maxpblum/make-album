let waitUntilUnlocked = Promise.resolve();

const runningIntervals = [];
const intervalsToResume = [];
const pauseIntervals = () => {
  for (const interval of runningIntervals) {
    clearInterval(interval);
  }
  runningIntervals.length = 0;
};
const resumeIntervals = () => {
  for (const callback of intervalsToResume) {
    runningIntervals.push(setInterval(callback, 3000));
  }
};

window.pauseIntervals = pauseIntervals;
window.resumeIntervals = resumeIntervals;

const loadImpl = (url, taskWhenChanged, reload) => {
  let stored = null;
  let waiting = false;
  const fetchAndUpdate = () => {
    if (waiting) return;
    waiting = true;
    waitUntilUnlocked = waitUntilUnlocked.then(async () => {
      const response = await fetch(url);
      const text = await response.text();
      if (text !== stored) {
        const old = stored;
        stored = text
        taskWhenChanged(text, old);
      }
      waiting = false;
    });
  };
  fetchAndUpdate();
  if (!reload) return;
  pauseIntervals();
  intervalsToResume.push(fetchAndUpdate);
  resumeIntervals();
};

export const loadOnce = (url, task) => loadImpl(url, task, false);
export const hotReload = (url, task) => loadImpl(url, task, true);
