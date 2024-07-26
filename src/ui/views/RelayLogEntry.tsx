import React, { useMemo } from 'react'

import { Badge, Group, Text } from '@mantine/core'

import { type RelayTimelineEntry, RelayTimelineEntryType } from '../../parser/types'
import { IconArrowLeft, IconDots, IconStackPop, IconStackPush } from '@tabler/icons-react'

interface RelayLogEntryProps {
  key: string
  style: object
  entry: RelayTimelineEntry
}

const RelayLogEntry = (props: RelayLogEntryProps) => {
  const { key, style, entry } = props

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
    <Group key={key} style={style}>
      <Badge variant="light">{entry.process.name || entry.process.id}</Badge>
      <Badge variant="light" color="yellow">
        {entry.thread.name || entry.thread.id}
      </Badge>
      <Group>
        {Array.from({ length: indent }).map((_, index) => (
          <IconDots size={16} opacity={0.15} key={index} />
        ))}
        {entry.type === RelayTimelineEntryType.CALL ? (
          <Text>
            <IconStackPop size={16} />
            <IconStackPush size={16} />
            {entry.module}.<strong>{entry.func}</strong>({entry.args})
          </Text>
        ) : entry.type === RelayTimelineEntryType.RETURN ? (
          <Text>
            <IconArrowLeft size={16} /> {entry.retval}
          </Text>
        ) : (
          <>
            <Badge variant="transparent" color="green" m={0}>
              {entry.channel}:{entry.logger}
            </Badge>
            <Text fz={13}>{entry.message}</Text>
          </>
        )}
      </Group>
    </Group>
  )
}

export default RelayLogEntry
