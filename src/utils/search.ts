import { type LogEntry, LogEntryType } from '../parser/types'

import { mod } from './math'

enum SearchDirection {
  NEXT = 'next',
  PREV = 'prev',
}

interface SearchFilter {
  (entry: LogEntry): boolean
}

const icontains = (str: string | undefined, needle: string) =>
  str?.toLowerCase().includes(needle.toLowerCase())

const findIndexMatching = (
  entries: LogEntry[],
  text: string,
  direction: SearchDirection,
  startIndex: number = direction === SearchDirection.NEXT ? 0 : entries.length - 1,
  filter?: SearchFilter,
) => {
  const { length } = entries
  for (let i = 0; i < length; ++i) {
    const index = mod(direction === SearchDirection.NEXT ? startIndex + i : startIndex - i, length)
    const entry = entries[index]

    if (filter && !filter(entry)) {
      continue
    }

    switch (entry.type) {
      default:
      case LogEntryType.MESSAGE:
        if (
          // TODO: class not visible in UI: icontains(entry.class, text) ||
          icontains(entry.channel, text) ||
          icontains(entry.logger, text) ||
          icontains(entry.message, text)
        ) {
          return index
        }
        break

      case LogEntryType.CALL:
        if (
          icontains(entry.module, text) ||
          icontains(entry.func, text) ||
          icontains(entry.callsite, text) ||
          entry.args?.some((arg) => icontains(arg, text))
        ) {
          return index
        }
        break

      case LogEntryType.RETURN:
        if (
          icontains(entry.module, text) ||
          icontains(entry.func, text) ||
          icontains(entry.callsite, text) ||
          icontains(entry.retval, text)
        ) {
          return index
        }
        break
    }
  }

  return undefined
}

export const findNextIndexMatching = (
  entries: LogEntry[],
  text: string,
  startIndex?: number,
  filter?: SearchFilter,
) => {
  return findIndexMatching(entries, text, SearchDirection.NEXT, startIndex, filter)
}

export const findPrevIndexMatching = (
  entries: LogEntry[],
  text: string,
  startIndex?: number,
  filter?: SearchFilter,
) => {
  return findIndexMatching(entries, text, SearchDirection.PREV, startIndex, filter)
}
