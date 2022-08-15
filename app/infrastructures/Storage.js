// @ts-check

/** @template {{ [key: string]: any }} TData */
class Storage {
  /**
   * @param {string} key
   * @param {Partial<TData>} [defaultData]
   */
  constructor(key, defaultData = {}) {
    this.key = key
    this.defaultData = defaultData
  }

  /**
   * Loads the data from the storage.
   * @returns {Promise<TData>}
   */
  async load() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.key, (currentData) => {
        const data = Object.assign({}, currentData, this.defaultData)

        resolve(/** @type {TData} */ (data))
      })
    })
  }

  /**
   * Update the data in the storage.
   * @param {(data: TData) => TData} fn
   * @returns {Promise<void>}
   */
  async update(fn) {
    const currentData = await this.load()
    await chrome.storage.sync.set({
      [this.key]: fn(currentData)
    })
  }

  /** Removes the data from storage. */
  async remove() {
    await chrome.storage.sync.remove(this.key)
  }

  /**
   * Watches the changes in the storage's data, and returns a stop watching.
   * @param {(data: TData) => void} fn
   * @returns {() => void}
   */
  watch(fn) {
    const handler = (changes, area) => {
      if (area !== 'sync') return

      const newData = /** @type {TData | null} */ (changes[this.key]?.newValue)

      if (!newData) return

      fn(newData)
    }

    chrome.storage.onChanged.addListener(handler)

    return () => chrome.storage.onChanged.removeListener(handler)
  }
}

export default Storage
