export const promisersListToPromiseChain = getters => {
  let cur = Promise.resolve();
  for (const getter of getters) {
    cur = cur.then(() => getter());
  }
  return cur;
};
