/* eslint-disable import/prefer-default-export */

// See: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read#example_2_-_handling_text_line_by_line
export async function* streamLinesFrom(
  rstream: ReadableStream<Uint8Array>,
  options?: { onReadProgress?: (bytesRead: number) => void },
) {
  let bytesRead = 0

  const utf8Decoder = new TextDecoder('utf8')
  let reader = rstream.getReader()
  let result = await reader.read()

  if (result.value) {
    bytesRead += result.value.length
    options?.onReadProgress?.(bytesRead)
  }

  let str = result.value ? utf8Decoder.decode(result.value, { stream: true }) : ''

  const re = /\r?\n/gm
  let startIndex = 0

  while (true) {
    let match = re.exec(str)
    if (!match) {
      if (result.done) {
        break
      }
      let remainder = str.slice(startIndex)
      result = await reader.read()

      if (result.value) {
        bytesRead += result.value.length
        options?.onReadProgress?.(bytesRead)
      }

      const next = result.value ? utf8Decoder.decode(result.value, { stream: true }) : ''
      str = remainder + next
      startIndex = re.lastIndex = 0
      continue
    }
    yield str.substring(startIndex, match.index)
    startIndex = re.lastIndex
  }

  // Ensure last line is emitted correctly when lacking newline
  if (startIndex < str.length) {
    yield str.slice(startIndex)
  }
}
