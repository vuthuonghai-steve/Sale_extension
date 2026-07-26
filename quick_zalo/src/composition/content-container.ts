export function createContentContainer() {
  return {
    extractDom() {
      return {
        title: document.title,
        text: document.body?.innerText ?? '',
      };
    },
  };
}
