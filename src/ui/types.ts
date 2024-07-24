import { type RelayParseResult } from '../parser/types'

export interface ExplorerFile {
  uuid: string
  name: string
  file: File
  result?: RelayParseResult
}
