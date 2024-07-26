import type { LogParseResult } from '../parser/types'

export interface LogFile {
  uuid: string
  name: string
  file: File
  result?: LogParseResult
}
