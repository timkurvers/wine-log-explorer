// See: https://stackoverflow.com/a/77377871
interface ReadableStream<R = any> {
  [Symbol.asyncIterator](): AsyncIterableIterator<R>
}
