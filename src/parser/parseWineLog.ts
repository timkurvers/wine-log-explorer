import { streamLinesFrom } from '../utils/index'

import { LogParseResult, LogProcess, LogThread, LogEntry, LogEntryType, pid, tid } from './types'

const LINE_MATCHER = /(?<pid>[a-f0-9]{4}):(?<tid>[a-f0-9]{4}):(?<type>[a-zA-Z_:]+) +(?<message>.+)/

const CALL_RET_MATCHER =
  /(?:(?:(?<module>[\w]+)\.(?<func>[\w]+))|(?<unknown>.+))\((?<args>[^)]+)?\)(?: retval=(?<retval>[a-f0-9]+))?(?: ret=(?<ret>[a-f0-9]+))?/

const WIDE_STRING_MATCHER = /L"(?<string>.+)"/

const BASENAME_MATCHER = /[^\\]+$/

type LineMatcherRegexResult = RegExpExecArray & {
  groups: {
    timestamp: string
    pid: string
    tid: string
    type: LogEntryType
    message: string
  }
}

type CallRetRegexResult = RegExpExecArray & {
  groups: {
    unknown: string
    module: string
    func: string
    args: string
    retval?: LogEntryType
    ret: string
  }
}

type WideStringMatcherRegexResult = RegExpExecArray & {
  groups: {
    string: string
  }
}

enum ParserMode {
  NORMAL,
  RECOVERY,
  BACKFILL_FROM_CACHE,
}

enum RelayChannel {
  MODULE = 'module',
  THREADNAME = 'threadname',
}

enum RelayLogger {
  GET_LOAD_ORDER = 'get_load_order',
}

// Overloads
async function parseWineLog(
  input: string,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<LogParseResult>
async function parseWineLog(
  input: Blob,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<LogParseResult>
async function parseWineLog(
  input: ReadableStream<Uint8Array>,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<LogParseResult>

// TODO: AbortController support
// TODO: Comments for this entire implementation

async function parseWineLog(
  input: string | Blob | ReadableStream<Uint8Array>,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<LogParseResult> {
  if (typeof input === 'string') {
    return parseWineLog(new Blob([input]), options)
  } else if (input instanceof Blob) {
    return parseWineLog(input.stream(), options)
  }

  const rstream: ReadableStream<Uint8Array> = input

  const entries: LogEntry[] = []
  const processes: Record<pid, LogProcess> = {}
  const threads: Record<pid, Record<tid, LogThread>> = {}
  const contexts: Record<pid, Record<tid, LogEntry | undefined>> = {}

  const lines = streamLinesFrom(rstream, {
    onReadProgress: options?.onReadProgress,
  })

  let mode = ParserMode.NORMAL
  const cache = []

  let line: string = ''
  let index = 0
  while (true) {
    if (mode === ParserMode.BACKFILL_FROM_CACHE) {
      if (cache.length) {
        line = cache.shift()!
      } else {
        mode = ParserMode.NORMAL
      }
    }

    if (mode !== ParserMode.BACKFILL_FROM_CACHE) {
      const result = await lines.next()
      if (result.done) {
        break
      }
      line = result.value
    }

    const malformed = LINE_MATCHER.exec(line.slice(1)) as LineMatcherRegexResult
    if (malformed) {
      mode = ParserMode.RECOVERY
      cache.push(line.slice(0, malformed.index + 1), line.slice(malformed.index + 1))
      continue
    }

    const match = line.match(LINE_MATCHER) as LineMatcherRegexResult
    if (!match) {
      if (mode === ParserMode.RECOVERY) {
        cache[0] += line
        mode = ParserMode.BACKFILL_FROM_CACHE
      }
      continue
    } else if (mode === ParserMode.RECOVERY) {
      cache.push(line)
      continue
    }

    const { pid, tid, type, message } = match.groups

    let process = processes[pid]
    if (!process) {
      process = { id: pid, name: null, threads: [] }
      processes[pid] = process
      threads[pid] = {}
      contexts[pid] = {}
    }

    let thread = threads[pid][tid]
    if (!thread) {
      thread = { id: tid, name: null }
      threads[pid][tid] = thread
      processes[pid].threads.push(thread)
    }

    const context = contexts[pid][tid]

    const entry: LogEntry = { index, process, thread }
    if (context) {
      entry.context = context
    }

    switch (type) {
      case LogEntryType.CALL:
      case LogEntryType.RETURN:
        const crmatch = message.match(CALL_RET_MATCHER) as CallRetRegexResult
        if (!crmatch) {
          throw new Error(`could not parse Call/Ret line: '${line}'`)
        }

        const {
          groups: { unknown, module, func, args, retval, ret },
        } = crmatch

        // TODO: Skipping over unknown Call/Ret entries (for now)
        if (unknown) {
          continue
        }

        Object.assign(entry, {
          type,
          module,
          func,
          ret,
        })

        if (type === LogEntryType.CALL) {
          Object.assign(entry, {
            args: args?.split(','),
          })

          contexts[pid][tid] = entry
        } else {
          Object.assign(entry, {
            retval,
          })

          contexts[pid][tid] = context?.context
        }
        break
      default:
        const [cls, channel, logger] = type.split(':')

        Object.assign(entry, {
          channel,
          class: cls,
          logger,
          message,
        })

        if (channel === RelayChannel.THREADNAME) {
          const strmatch = message.match(WIDE_STRING_MATCHER) as WideStringMatcherRegexResult
          if (strmatch) {
            thread.name = strmatch.groups.string
          }
        } else if (channel === RelayChannel.MODULE && logger === RelayLogger.GET_LOAD_ORDER) {
          const strmatch = message.match(WIDE_STRING_MATCHER) as WideStringMatcherRegexResult
          if (strmatch && !process.path) {
            process.path = strmatch.groups.string.replaceAll('\\\\', '\\')
            process.name = process.path.match(BASENAME_MATCHER)![0]
          }
          if (!strmatch) {
            throw new Error(`could not extract wide string from message: ${message}`)
          }
        }
    }

    entries.push(entry)
    ++index
  }

  return {
    processes: Object.values(processes),
    entries,
  }
}

export default parseWineLog
