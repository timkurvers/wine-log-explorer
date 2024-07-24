// See: https://stackoverflow.com/a/77377871
interface ReadableStream<R> {
  [Symbol.asyncIterator](): AsyncIterableIterator<R>
}
