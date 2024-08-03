import React, { useMemo } from 'react'

import { Badge, Group, Highlight, Text } from '@mantine/core'

import { type LogEntry, LogEntryType } from '../../parser/types'

import Arrow from '../components/Arrow'
import BoxCharacter from '../components/BoxCharacter'
import SyntaxCharacter from '../components/SyntaxCharacter'

import classes from './LogRow.module.css'

interface LogRowProps {
  entry: LogEntry
  isCurrentSearchIndex: boolean
  searchText: string
  style?: object
}

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
        <Text className={classes.text}>
          {line} <Arrow /> <Highlight {...highlightProps}>{entry.return?.retval || '?'}</Highlight>
        </Text>
      )
    }

    return <Text className={classes.text}>{line}</Text>
  } else if (entry.type === LogEntryType.RETURN) {
    return (
      <Group gap={0} wrap="nowrap">
        <BoxCharacter.End />
        <Text className={classes.text}>
          <Arrow /> <Highlight {...highlightProps}>{entry.retval}</Highlight>
        </Text>
      </Group>
    )
  }

  return (
    <>
      <Badge variant="transparent" color="green" p={0} flex="none">
        <Highlight {...highlightProps}>{entry.channel}</Highlight>
        <SyntaxCharacter>:</SyntaxCharacter>
        <Highlight {...highlightProps}>{entry.logger}</Highlight>
      </Badge>
      <Highlight className={classes.text} {...highlightProps}>
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
    // Ensure long entries are allowed to expand beyond 100% width
    <Group style={{ ...style, minWidth: '100%', width: 'auto' }} gap="sm" wrap="nowrap">
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
