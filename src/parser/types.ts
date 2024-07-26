export type pid = string
export type tid = string
export type pidtid = string
export type msgclass = string
export type channel = string
export type logger = string
export type module = string

export interface RelayProcess {
  id: string
  name: string | null
  path?: string
  threads: RelayThread[]
}

export interface RelayThread {
  id: string
  name: string | null
}

export enum RelayTimelineEntryType {
  CALL = 'Call',
  RETURN = 'Ret',
  MESSAGE = 'Message',
}

export interface RelayTimelineCall {
  type: RelayTimelineEntryType.CALL
  module: module
  func: string
  args: string[]
  ret: string
}

export interface RelayTimelineReturn {
  type: RelayTimelineEntryType.RETURN
  module: module
  func: string
  retval: string
  ret: string
}

export interface RelayTimelineMessage {
  type?: RelayTimelineEntryType.MESSAGE
  class?: msgclass
  channel?: channel
  logger?: logger
  message?: string
}

export type RelayTimelineEntry = {
  index: number
  process: RelayProcess
  thread: RelayThread
  context?: RelayTimelineEntry
} & (RelayTimelineReturn | RelayTimelineCall | RelayTimelineMessage)

export interface RelayParseResult {
  processes: RelayProcess[]
  timeline: RelayTimelineEntry[]
}
