export type pid = string
export type tid = string
export type eid = number
export type msgclass = string
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
  MESSAGE = 'Message',
}

export interface LogEntryCommon {
  id: eid
  process: LogProcess
  thread: LogThread
  parent?: LogEntryCall
  time?: number
}

export interface LogEntryRelayCommon {
  module: module
  func: string
  callsite: string
}

export type LogEntryMessage = LogEntryCommon & {
  type?: LogEntryType.MESSAGE
  class: msgclass
  channel: channel
  logger: logger
  message: string
}

export type LogEntryCall = LogEntryCommon &
  LogEntryRelayCommon & {
    type: LogEntryType.CALL
    args?: string[]
    return?: LogEntryReturn
    inlinable?: boolean
    isExpanded?: boolean
  }

export type LogEntryReturn = LogEntryCommon &
  LogEntryRelayCommon & {
    type: LogEntryType.RETURN
    retval: string
  }

export type LogEntry = LogEntryMessage | LogEntryCall | LogEntryReturn

export interface LogParseResult {
  processes: LogProcess[]
  entries: LogEntry[]
}
