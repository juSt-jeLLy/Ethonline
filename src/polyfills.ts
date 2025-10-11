import { Buffer } from 'buffer'

// Polyfill Buffer for browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
  window.global = window.global || window
  window.process = window.process || { env: {} }
}

export {}