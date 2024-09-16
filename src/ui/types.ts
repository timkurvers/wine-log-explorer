import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconExclamationCircle,
  IconMathFunction,
  IconProps,
  IconTool,
  IconTxt,
} from '@tabler/icons-react'

export interface LogFile {
  uuid: string
  name: string
  file: File
}

export enum LogFilterType {
  // Matches Wine debug classes
  // See: https://gitlab.winehq.org/wine/wine/-/wikis/Debug-Channels
  FIXME = 'fixme',
  ERROR = 'err',
  WARN = 'warn',
  TRACE = 'trace',

  RELAY = 'relay',
  TEXT = 'text',
}

export const LogFilterTypes: Record<
  LogFilterType,
  {
    label: string
    color: string
    icon: React.FunctionComponent<IconProps>
  }
> = {
  [LogFilterType.FIXME]: {
    label: 'Unimplemented (fixme)',
    color: 'blue',
    icon: IconTool,
  },
  [LogFilterType.ERROR]: {
    label: 'Errors (err)',
    color: 'red',
    icon: IconExclamationCircle,
  },
  [LogFilterType.WARN]: {
    label: 'Warnings (warn)',
    color: 'orange',
    icon: IconAlertTriangle,
  },
  [LogFilterType.TRACE]: {
    label: 'Debug (trace)',
    color: 'green',
    icon: IconActivityHeartbeat,
  },
  [LogFilterType.RELAY]: {
    label: 'Relay (call/ret)',
    color: 'gray',
    icon: IconMathFunction,
  },
  [LogFilterType.TEXT]: {
    label: 'Text Output',
    color: 'gray',
    icon: IconTxt,
  },
}
