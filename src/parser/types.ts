export type pid = string
export type tid = string
export type pidtid = string
export type msgclass = string
export type channel = string
export type logger = string
export type module = string

export interface LogProcess {
  id: string
  name: string | null
  path?: string
  threads: LogThread[]
}

export interface LogThread {
  id: string
  name: string | null
}

export enum LogEntryType {
  CALL = 'Call',
  RETURN = 'Ret',
  MESSAGE = 'Message',
}

export interface LogEntryCall {
  type: LogEntryType.CALL
  module: module
  func: string
  args: string[]
  ret: string
}

export interface LogEntryReturn {
  type: LogEntryType.RETURN
  module: module
  func: string
  retval: string
  ret: string
}

export interface LogEntryMessage {
  type?: LogEntryType.MESSAGE
  class?: msgclass
  channel?: channel
  logger?: logger
  message?: string
}

export type LogEntry = {
  index: number
  process: LogProcess
  thread: LogThread
  context?: LogEntry
} & (LogEntryMessage | LogEntryCall | LogEntryReturn)

export interface LogParseResult {
  processes: LogProcess[]
  entries: LogEntry[]
}
