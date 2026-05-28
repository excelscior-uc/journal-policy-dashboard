import '@testing-library/jest-dom'

// Node 25 provides a built-in localStorage stub via --localstorage-file that
// does not implement the full Web Storage API (no clear/setItem/getItem/etc.).
// Replace it with a proper in-memory implementation for tests.
;(() => {
  const store = new Map()
  const impl = {
    get length() { return store.size },
    key(n) { return [...store.keys()][n] ?? null },
    getItem(k) { return store.has(String(k)) ? store.get(String(k)) : null },
    setItem(k, v) { store.set(String(k), String(v)) },
    removeItem(k) { store.delete(String(k)) },
    clear() { store.clear() },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: impl, writable: true, configurable: true })
  Object.defineProperty(globalThis, 'sessionStorage', { value: { ...impl }, writable: true, configurable: true })
})()
