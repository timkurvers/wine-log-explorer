import { streamLinesFrom } from '../utils/index'

import { RelayParseResult, RelayProcess, RelayTimelineEntry, RelayTimelineEntryType } from './types'

const LINE_MATCHER = /(?<pid>[a-f0-9]{4}):(?<tid>[a-f0-9]{4}):(?<type>[a-zA-Z_:]+) +(?<message>.+)/

const CALL_RET_MATCHER =
  /(?:(?:(?<module>[\w]+)\.(?<func>[\w]+))|(?<unknown>.+))\((?<args>[^)]+)?\)(?: retval=(?<retval>[a-f0-9]+))?(?: ret=(?<ret>[a-f0-9]+))?/

type LineMatcherRegexResult = RegExpExecArray & {
  groups: {
    timestamp: string
    pid: string
    tid: string
    type: RelayTimelineEntryType
    message: string
  }
}

type CallRetRegexResult = RegExpExecArray & {
  groups: {
    unknown: string
    module: string
    func: string
    args: string
    retval?: RelayTimelineEntryType
    ret: string
  }
}

enum ParserMode {
  NORMAL,
  RECOVERY,
  BACKFILL_FROM_CACHE,
}

// Overloads
async function parseRelayLog(
  input: string,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<RelayParseResult>
async function parseRelayLog(
  input: Blob,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<RelayParseResult>
async function parseRelayLog(
  input: ReadableStream<Uint8Array>,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<RelayParseResult>

// TODO: AbortController support

async function parseRelayLog(
  input: string | Blob | ReadableStream<Uint8Array>,
  options?: { onReadProgress?: (bytesRead: number) => void },
): Promise<RelayParseResult> {
  if (typeof input === 'string') {
    return parseRelayLog(new Blob([input]), options)
  } else if (input instanceof Blob) {
    return parseRelayLog(input.stream(), options)
  }

  const rstream: ReadableStream<Uint8Array> = input

  const timeline: RelayTimelineEntry[] = []
  const processes: RelayProcess[] = []

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

    const entry = { index, pid, tid }

    switch (type) {
      case RelayTimelineEntryType.CALL:
      case RelayTimelineEntryType.RETURN:
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

        if (type === RelayTimelineEntryType.CALL) {
          Object.assign(entry, {
            args: args?.split(','),
          })
        } else {
          Object.assign(entry, {
            retval,
          })
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
    }

    timeline.push(entry)
    ++index
  }

  return {
    processes,
    timeline,
  }
}

export default parseRelayLog
