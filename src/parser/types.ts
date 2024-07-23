export type pid = string
export type tid = string
export type msgclass = string
export type channel = string
export type logger = string
export type module = string

export interface RelayProcess {
  id: string
  name: string
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
  address: number
}

export interface RelayTimelineReturn {
  type: RelayTimelineEntryType.RETURN
  module: module
  func: string
  retval: string
  address: number
}

export interface RelayTimelineMessage {
  class?: msgclass
  channel?: channel
  logger?: logger
  message?: string
}

export type RelayTimelineEntry = {
  index: number
  pid: pid
  tid: tid
} & (RelayTimelineReturn | RelayTimelineCall | RelayTimelineMessage)

export interface RelayParseResult {
  processes: RelayProcess[]
  timeline: RelayTimelineEntry[]
}
