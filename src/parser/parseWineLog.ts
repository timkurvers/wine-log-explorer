import { streamLinesFrom } from '../utils/index'

import {
  type LogParseResult,
  type LogProcess,
  type LogThread,
  type LogEntry,
  type LogEntryCall,
  type LogEntryCommon,
  LogEntryType,
  type pid,
  type tid,
  LogEntryProcessCommon,
} from './types'

const TIMESTAMP_START_MATCHER = /^\d+\.\d+:/

const LINE_MATCHER =
  /(?:(?<timestamp>\d+\.\d+):)?(?<pid>[a-f0-9]{4}):(?<tid>[a-f0-9]{4}):(?<type>[^\s]+)\s*(?<message>.*)/

const CALL_RET_MATCHER =
  /(?:(?:(?<module>[\w]+)\.(?<func>[\w]+))|(?<unknown>.+))\((?<args>.+)?\)(?: retval=(?<retval>[a-f0-9]+))?(?: ret=(?<callsite>[a-f0-9]+))?/

const WIDE_STRING_MATCHER = /L"(?<string>.+)"/

const BASENAME_MATCHER = /[^\\]+$/

// TODO: Some captures should be marked optional
type LineMatcherRegexResult = RegExpExecArray & {
  groups: {
    timestamp: string
    pid: string
    tid: string
    type: LogEntryType
    message: string
  }
}

// TODO: Some captures should be marked optional
type CallRetRegexResult = RegExpExecArray & {
  groups: {
    unknown: string
    module: string
    func: string
    args: string
    retval: string
    callsite: string
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
  const calls: Record<pid, Record<tid, LogEntryCall | undefined>> = {}
  const previous: Record<pid, Record<tid, LogEntry | undefined>> = {}

  const lines = streamLinesFrom(rstream, {
    onReadProgress: options?.onReadProgress,
  })

  let mode = ParserMode.NORMAL
  let malformCheckOffset = 1
  const cache = []

  let line: string = ''
  let id = 0
  let startTimestamp
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

    const malformed = LINE_MATCHER.exec(line.slice(malformCheckOffset)) as LineMatcherRegexResult
    if (malformed) {
      if (malformCheckOffset === 1) {
        const timestamp = TIMESTAMP_START_MATCHER.exec(line)
        if (timestamp) {
          malformCheckOffset = timestamp[0].length + 1
          mode = ParserMode.BACKFILL_FROM_CACHE
          cache.push(line)
          continue
        }
      }
      mode = ParserMode.RECOVERY
      cache.push(
        line.slice(0, malformed.index + malformCheckOffset),
        line.slice(malformed.index + malformCheckOffset),
      )
      continue
    }

    const match = line.match(LINE_MATCHER) as LineMatcherRegexResult
    if (!match) {
      if (mode === ParserMode.RECOVERY) {
        cache[0] += line
        mode = ParserMode.BACKFILL_FROM_CACHE
      } else {
        const entry: LogEntry = {
          id,
          type: LogEntryType.TEXT,
          text: line,
        }
        entries.push(entry)
        ++id
      }
      continue
    } else if (mode === ParserMode.RECOVERY) {
      cache.push(line)
      continue
    }

    const { pid, tid, type, message, timestamp } = match.groups

    let process = processes[pid]
    if (!process) {
      process = { id: pid, name: null, threads: [] }
      processes[pid] = process
      threads[pid] = {}
      calls[pid] = {}
      previous[pid] = {}
    }

    let thread = threads[pid][tid]
    if (!thread) {
      thread = { id: tid, name: null }
      threads[pid][tid] = thread
      processes[pid].threads.push(thread)
    }

    const call = calls[pid][tid]

    let entry: LogEntry
    const common: LogEntryCommon & LogEntryProcessCommon = { id, process, thread }

    if (timestamp) {
      const time = (parseFloat(timestamp) * 1000) | 0
      if (!startTimestamp) {
        startTimestamp = time
      }
      common.time = time - startTimestamp
    }

    switch (type) {
      case LogEntryType.CALL:
      case LogEntryType.RETURN:
        const crmatch = message.match(CALL_RET_MATCHER) as CallRetRegexResult
        if (!crmatch) {
          throw new Error(`could not parse Call/Ret line: '${line}'`)
        }

        const {
          groups: { unknown, module, func, args, retval, callsite },
        } = crmatch

        // TODO: Skipping over unknown Call/Ret entries (for now)
        if (unknown) {
          continue
        }

        const relayCommon = { module, func, callsite }

        if (type === LogEntryType.CALL) {
          entry = {
            type: LogEntryType.CALL,
            ...common,
            ...relayCommon,
            args: args?.split(','),
          }

          calls[pid][tid] = entry
        } else {
          entry = {
            type: LogEntryType.RETURN,
            ...common,
            ...relayCommon,
            retval,
          }

          // Connect Ret-entry to Call-entry when callsite (address) is a match
          if (call && entry.callsite === call.callsite) {
            call.return = entry

            // Mark as inlinable when a Call-entry is immediately followed by its corresponding Ret-entry
            if (previous[pid][tid] === call) {
              call.inlinable = true
            }
          }

          calls[pid][tid] = call?.parent
        }
        break
      default:
        const [cls, channel = '', logger = ''] = type.split(':')

        const isValidClass = cls === 'fixme' || cls === 'err' || cls === 'warn' || cls === 'trace'

        entry = {
          ...common,
          channel,
          class: isValidClass ? cls : 'trace',
          logger,
          message: isValidClass ? message : `${type} ${message}`,
        }

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

    if (call) {
      entry.parent = call
    }

    entries.push(entry)
    previous[pid][tid] = entry
    ++id
  }

  return {
    processes: Object.values(processes),
    entries,
  }
}

export default parseWineLog
