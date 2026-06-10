import '@testing-library/jest-dom/vitest'

// jsdom has no canvas; force measureMaxTextWidth onto its char-count fallback
// instead of letting jsdom emit a "Not implemented: getContext" error.
HTMLCanvasElement.prototype.getContext = () => null as unknown as CanvasRenderingContext2D
