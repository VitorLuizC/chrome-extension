// @ts-check

/** @template {{ [key: string]: any }} TData */
class Storage {
  /**
   * @param {string} key
   * @param {Partial<TData>} [defaultData]
   */
  constructor(key, defaultData = {}) {
    this.key = key;
    this.defaultData = defaultData;
  }

  /**
   * Loads the data from the storage.
   * @returns {Promise<TData>}
   */
  load() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.key, (currentData) => {
        const data = Object.assign({}, currentData, this.defaultData);

        resolve(/** @type {TData} */ (data));
      });
    });
  }

  /**
   * Update the data in the storage.
   * @param {(data: TData) => TData} fn
   * @returns {Promise<void>}
   */
  update(fn) {
    return this.load().then((currentData) => {
      return chrome.storage.sync.set({
        [this.key]: fn(currentData),
      });
    });
  }

  /**
   * Removes the data from storage.
   * @returns {Promise<void>}
   */
  remove() {
    return chrome.storage.sync.remove(this.key);
  }

  /**
   * Subscribes into storage's data changes, and returns a function to unsubscribe.
   * @param {(data: TData) => void} fn
   * @returns {() => void}
   */
  subscribe(fn) {
    const handler = (changes, area) => {
      if (area !== 'sync') return;

      const newData = changes[this.key] && changes[this.key].newValue;

      if (!newData) return;

      fn(/** @typedef {TData} */ newData);
    };

    chrome.storage.onChanged.addListener(handler);

    return () => chrome.storage.onChanged.removeListener(handler);
  }
}

export default Storage;
