import React, { useMemo } from 'react'

import { Badge, Group, Text } from '@mantine/core'

import { type LogEntry, LogEntryType } from '../../parser/types'
import { IconArrowLeft, IconDots, IconStackPop, IconStackPush } from '@tabler/icons-react'

interface LogRowProps {
  style: object
  entry: LogEntry
}

// TODO: Use classes
const textSize = 14

const LogRow = (props: LogRowProps) => {
  const { style, entry } = props

  const indent = useMemo(() => {
    let level = 0
    let current = entry.context
    while (current) {
      current = current?.context
      ++level
    }
    return level
  }, [entry])

  return (
    <Group style={style}>
      <Badge variant="light">{entry.process.name || entry.process.id}</Badge>
      <Badge variant="light" color="yellow">
        {entry.thread.name || entry.thread.id}
      </Badge>
      <Group>
        {Array.from({ length: indent }).map((_, index) => (
          <IconDots size={16} opacity={0.15} key={index} />
        ))}
        {entry.type === LogEntryType.CALL ? (
          <Text fz={textSize}>
            <IconStackPop size={16} />
            <IconStackPush size={16} />
            {entry.module}.<strong>{entry.func}</strong>({entry.args})
          </Text>
        ) : entry.type === LogEntryType.RETURN ? (
          <Text fz={textSize}>
            <IconArrowLeft size={16} /> {entry.retval}
          </Text>
        ) : (
          <>
            <Badge variant="transparent" color="green" m={0}>
              {entry.channel}:{entry.logger}
            </Badge>
            <Text fz={textSize}>{entry.message}</Text>
          </>
        )}
      </Group>
    </Group>
  )
}

export default LogRow
