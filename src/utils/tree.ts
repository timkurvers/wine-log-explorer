import { LogEntry, LogEntryCall, LogEntryType } from '../parser/types'

export const calculateDepth = (entry: LogEntry) => {
  let level = 0
  let current = entry.parent
  while (current) {
    current = current.parent
    ++level
  }

  // Show return values at the same level as the initial call
  if (entry.type === LogEntryType.RETURN) {
    return level - 1
  }

  return level
}

export const isVisible = (entry: LogEntry): boolean => {
  let current = entry.parent
  while (current) {
    // Hide this entry if an ancestor is not expanded
    if (!current.isExpanded) {
      return false
    }

    current = current.parent
  }

  // Top level (no parent) is always visible
  return true
}

interface CompactFilter {
  (entry: LogEntry): boolean
}

// Compacts given list of all entries into a compact list without any call subtrees
export const compactTree = (all: LogEntry[], filter?: CompactFilter) => {
  return all.filter((entry) => isVisible(entry) && (!filter || filter(entry)))
}

// Efficiently compacts the call subtree in the given compact list
export const compactTreeForCall = (
  compact: LogEntry[],
  all: LogEntry[],
  call: LogEntryCall,
  filter?: CompactFilter,
) => {
  const index = compact.indexOf(call)

  // Fast bail if call entry is not in compact list
  if (index === -1) {
    return compact
  }

  // All entries up to and including this call entry itself (will be used as-is)
  const pre = compact.slice(0, index + 1)

  // Any expandable sub entries (or from other threads and thus visible)
  const subtree: LogEntry[] = all
    .slice(call.id + 1, call.return ? call.return.id + 1 : undefined)
    .filter((entry) => isVisible(entry) && (!filter || filter(entry)))

  // All entries after the return entry of this call
  let post: LogEntry[] = []
  if (call.return) {
    // Need to look up return entry in all entries (may not be visible)
    const next = all[all.indexOf(call.return) + 1]
    const nextIndex = compact.indexOf(next)
    if (nextIndex !== -1) {
      post = compact.slice(nextIndex)
    }
  }

  return pre.concat(subtree).concat(post)
}
