export default function(url, taskWhenChanged) {
  let stored = null;
  return setInterval(() => {
    fetch(url)
      .then(response => response.text())
      .then(text => {
        if (text !== stored) {
          const old = stored;
          stored = text;
          taskWhenChanged(text, old);
        }
      });
  }, 3000);
};
