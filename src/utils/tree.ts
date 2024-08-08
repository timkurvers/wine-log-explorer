import { LogEntry, LogEntryType } from '../parser/types'

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
