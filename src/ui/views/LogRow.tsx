import React, { useMemo } from 'react'

import { Badge, Group, Highlight, Text } from '@mantine/core'

import { type LogEntry, LogEntryType } from '../../parser/types'

import Arrow from '../components/Arrow'
import BoxCharacter from '../components/BoxCharacter'
import SyntaxCharacter from '../components/SyntaxCharacter'

interface LogRowProps {
  entry: LogEntry
  isCurrentSearchIndex: boolean
  searchText: string
  style?: object
}

// TODO: Use classes
const textSize = 14

const LogRowInner = (props: LogRowProps) => {
  const { entry, isCurrentSearchIndex, searchText } = props

  const highlightProps = {
    color: isCurrentSearchIndex ? 'orange' : 'yellow',
    highlight: searchText,
    span: true,
    inherit: true,
  }

  if (entry.type === LogEntryType.CALL) {
    const line = (
      <>
        <Highlight {...highlightProps}>{entry.module}</Highlight>
        <SyntaxCharacter>.</SyntaxCharacter>
        <Highlight fw="bold" {...highlightProps}>
          {entry.func}
        </Highlight>
        <SyntaxCharacter>(</SyntaxCharacter>
        <Highlight {...highlightProps}>{entry.args?.join(', ') || ''}</Highlight>
        <SyntaxCharacter>)</SyntaxCharacter>
      </>
    )

    if (entry.inlinable) {
      return (
        <Text fz={textSize}>
          {line} <Arrow /> <Highlight {...highlightProps}>{entry.return?.retval || '?'}</Highlight>
        </Text>
      )
    }

    return <Text fz={textSize}>{line}</Text>
  } else if (entry.type === LogEntryType.RETURN) {
    return (
      <Group gap={0}>
        <BoxCharacter.End />
        <Text fz={textSize}>
          <Arrow /> <Highlight {...highlightProps}>{entry.retval}</Highlight>
        </Text>
      </Group>
    )
  }

  return (
    <>
      <Badge variant="transparent" color="green" p={0}>
        <Highlight {...highlightProps}>{entry.channel}</Highlight>
        <SyntaxCharacter>:</SyntaxCharacter>
        <Highlight {...highlightProps}>{entry.logger}</Highlight>
      </Badge>
      <Highlight fz={textSize} {...highlightProps}>
        {entry.message}
      </Highlight>
    </>
  )
}

const LogRow = (props: LogRowProps) => {
  const { entry, style } = props

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

        <LogRowInner {...props} />
      </Group>
    </Group>
  )
}

export default LogRow
