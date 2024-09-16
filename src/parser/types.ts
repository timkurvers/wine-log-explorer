export type pid = string
export type tid = string
export type eid = number
export type msgclass = 'fixme' | 'err' | 'warn' | 'trace'
export type channel = string
export type logger = string
export type module = string

export interface LogProcess {
  id: pid
  name: string | null
  path?: string
  threads: LogThread[]
}

export interface LogThread {
  id: tid
  name: string | null
}

export enum LogEntryType {
  CALL = 'Call',
  RETURN = 'Ret',
  TEXT = 'Text',
}

export interface LogEntryCommon {
  id: eid
  time?: number
}

export interface LogEntryProcessCommon {
  process: LogProcess
  thread: LogThread
  parent?: LogEntryCall
}

export interface LogEntryRelayCommon {
  module: module
  func: string
  callsite: string
}

export type LogEntryMessage = LogEntryCommon &
  LogEntryProcessCommon & {
    type?: never
    class: msgclass
    channel: channel
    logger: logger
    message: string
  }

export type LogEntryCall = LogEntryCommon &
  LogEntryProcessCommon &
  LogEntryRelayCommon & {
    type: LogEntryType.CALL
    args?: string[]
    return?: LogEntryReturn
    inlinable?: boolean
    isExpanded?: boolean
  }

export type LogEntryReturn = LogEntryCommon &
  LogEntryProcessCommon &
  LogEntryRelayCommon & {
    type: LogEntryType.RETURN
    retval: string
  }

export type LogEntryText = LogEntryCommon & {
  type: LogEntryType.TEXT
  text: string
  parent?: never
}

export type LogEntry = LogEntryMessage | LogEntryCall | LogEntryReturn | LogEntryText

export interface LogParseResult {
  processes: LogProcess[]
  entries: LogEntry[]
}
