import hotReload from './hotReload.mjs';

const originalSetTimeout = window.setTimeout;
const resolveAfterPromises = () => new Promise((resolve) => originalSetTimeout(resolve, 0));

describe("hotReload", function() {
  it("executes the function when the content changes", function() {
    jasmine.clock().install();
    const content = {
      testUrl: 'oldContent',
    };
    const oldFetch = window.fetch;
    window.fetch = (url) => Promise.resolve({ text: () => Promise.resolve(content[url]) });
    const results = [];

    expect(results).toEqual([]);

    const interval = hotReload('testUrl', (newText, oldText) => {
      results.push([newText, oldText]);
    });

    jasmine.clock().tick(7000);

    return resolveAfterPromises().then(() => {
      expect(results).toEqual([['oldContent', null]]);
      results.length = 0;

      content.testUrl = 'newContent';
      jasmine.clock().tick(3000);
      return resolveAfterPromises();
    }).then(() => {
      expect(results).toEqual([['newContent', 'oldContent']]);

      window.fetch = oldFetch;
      clearInterval(interval);
    });
  });
});
