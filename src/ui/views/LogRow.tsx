import React, { useMemo } from 'react'

import { Badge, Group, Text } from '@mantine/core'

import { type LogEntry, LogEntryType } from '../../parser/types'

import Arrow from '../components/Arrow'
import BoxCharacter from '../components/BoxCharacter'
import SyntaxCharacter from '../components/SyntaxCharacter'

interface LogRowProps {
  style?: object
  entry: LogEntry
}

// TODO: Use classes
const textSize = 14

const LogRowInner = (props: LogRowProps) => {
  const { entry } = props

  if (entry.type === LogEntryType.CALL) {
    const line = (
      <>
        {entry.module}
        <SyntaxCharacter>.</SyntaxCharacter>
        <Text fw="bold" span inherit>
          {entry.func}
        </Text>
        <SyntaxCharacter>(</SyntaxCharacter>
        {entry.args?.join(', ')}
        <SyntaxCharacter>)</SyntaxCharacter>
      </>
    )

    if (entry.inlinable) {
      return (
        <Text fz={textSize}>
          {line} <Arrow /> {entry.return?.retval}
        </Text>
      )
    }

    return <Text fz={textSize}>{line}</Text>
  } else if (entry.type === LogEntryType.RETURN) {
    return (
      <Group gap={0}>
        <BoxCharacter.End />
        <Text fz={textSize}>
          <Arrow /> {entry.retval}
        </Text>
      </Group>
    )
  }

  return (
    <>
      <Badge variant="transparent" color="green" p={0}>
        {entry.channel}
        <SyntaxCharacter>:</SyntaxCharacter>
        {entry.logger}
      </Badge>
      <Text fz={textSize}>{entry.message}</Text>
    </>
  )
}

const LogRow = (props: LogRowProps) => {
  const { style, entry } = props

  const indent = useMemo(() => {
    let level = 0
    let current = entry.parent
    while (current) {
      current = current?.parent
      ++level
    }

    // Show return values at the same level as the initial call
    if (entry.type === LogEntryType.RETURN) {
      return level - 1
    }

    return level
  }, [entry])

  return (
    <Group style={style} gap="sm" wrap="nowrap">
      <Badge variant="light" flex="none">
        {entry.process.name || entry.process.id}
      </Badge>
      <Badge variant="light" color="yellow" flex="none">
        {entry.thread.name || entry.thread.id}
      </Badge>
      <Group gap="sm" miw={0} wrap="nowrap">
        {Array.from({ length: indent }).map((_, index) => (
          <BoxCharacter.Pipe key={index} />
        ))}

        <LogRowInner entry={entry} />
      </Group>
    </Group>
  )
}

export default LogRow
