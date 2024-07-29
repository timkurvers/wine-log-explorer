import parseWineLog from '../parser/parseWineLog'
import { LogParseResult } from '../parser/types'

// TODO: Incredibly loose type-checking here

interface ProgressPayload {
  type: 'progress'
  bytesRead: number
}

interface CompletePayload {
  type: 'complete'
  result: LogParseResult
}

interface ErrorPayload {
  type: 'error'
  error: Error
}

export type WorkerInputMessageEvent = MessageEvent<File>
export type WorkerOutputMessageEvent = MessageEvent<
  ProgressPayload | CompletePayload | ErrorPayload
>

// Worker receives a Wine log file to parse
self.addEventListener('message', async (message: WorkerInputMessageEvent) => {
  const file = message.data

  try {
    const result = await parseWineLog(file, {
      onReadProgress(bytesRead: number) {
        self.postMessage({ type: 'progress', bytesRead })
      },
    })
    self.postMessage({ type: 'complete', result })
  } catch (error) {
    self.postMessage({ type: 'error', error })
  }
})
