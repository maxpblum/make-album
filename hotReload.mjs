export default function(url, taskWhenChanged) {
  let stored = null;
  const fetchAndUpdate = () =>
    fetch(url)
      .then(response => response.text())
      .then(text => {
        if (text !== stored) {
          const old = stored;
          stored = text;
          taskWhenChanged(text, old);
        }
      });
  fetchAndUpdate();
  return setInterval(fetchAndUpdate, 3000);
};