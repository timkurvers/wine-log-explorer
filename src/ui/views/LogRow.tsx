import React, { useMemo } from 'react'

import { Badge, Group, Highlight, Text } from '@mantine/core'

import { type LogEntry, LogEntryType } from '../../parser/types'
import { calculateDepth } from '../../utils/tree'

import Arrow from '../components/Arrow'
import BoxCharacter from '../components/BoxCharacter'
import ChevronCharacter from '../components/ChevronCharacter'
import SyntaxCharacter from '../components/SyntaxCharacter'

import classes from './Text.module.css'
import { LogFilterTypes } from '../types'

interface LogRowProps {
  entry: LogEntry
  isCurrentSearchIndex: boolean
  searchText: string
  style?: object
  toggleExpansion: () => void
}

const LogRowInner = (props: LogRowProps) => {
  const { entry, isCurrentSearchIndex, searchText, toggleExpansion } = props

  const highlightProps = {
    color: isCurrentSearchIndex ? 'yellow.7' : 'yellow.3',
    highlight: searchText,
    span: true,
    inherit: true,
  }

  if (entry.type === LogEntryType.CALL) {
    const line = (
      <>
        {!entry.inlinable && <ChevronCharacter expanded={!!entry.isExpanded} onClick={toggleExpansion} />}
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

    if (entry.inlinable || !entry.isExpanded) {
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
          <Arrow /> <Highlight {...highlightProps}>{entry.retval}</Highlight>{' '}
          <Text c="dimmed" opacity={0.5} span inherit>
            [<Highlight {...highlightProps}>{entry.module}</Highlight>
            <SyntaxCharacter>.</SyntaxCharacter>
            <Highlight {...highlightProps}>{entry.func}</Highlight>]
          </Text>
        </Text>
      </Group>
    )
  } else if (entry.type === LogEntryType.TEXT) {
    return (
      <Group wrap="nowrap">
        <Badge variant="light" color="gray" flex="none">
          Text
        </Badge>
        <Highlight className={classes.text} {...highlightProps}>
          {entry.text}
        </Highlight>
      </Group>
    )
  }

  return (
    <>
      <Group gap={0} wrap="nowrap">
        <Badge variant="transparent" color={LogFilterTypes[entry.class]?.color} p={0} flex="none">
          <Highlight {...highlightProps}>{entry.class}</Highlight>
        </Badge>

        {entry.channel && (
          <>
            <SyntaxCharacter size="xs">:</SyntaxCharacter>
            <Badge variant="transparent" color="grape" p={0} flex="none">
              <Highlight {...highlightProps}>{entry.channel}</Highlight>
            </Badge>
          </>
        )}

        {entry.logger && (
          <>
            <SyntaxCharacter size="xs">:</SyntaxCharacter>
            <Badge variant="transparent" color="cyan" p={0} flex="none">
              <Highlight {...highlightProps}>{entry.logger}</Highlight>
            </Badge>
          </>
        )}
      </Group>
      <Highlight className={classes.text} {...highlightProps}>
        {entry.message}
      </Highlight>
    </>
  )
}

const LogRow = (props: LogRowProps) => {
  const { entry, style } = props

  const indent = useMemo(() => calculateDepth(entry), [entry])

  return (
    // Ensure long entries are allowed to expand beyond 100% width
    <Group style={{ ...style, minWidth: '100%', width: 'auto' }} gap="sm" wrap="nowrap">
      {entry.type !== LogEntryType.TEXT && (
        <>
          <Badge variant="light" flex="none">
            {entry.process.name || entry.process.id}
          </Badge>
          <Badge variant="light" color="yellow" flex="none">
            {entry.thread.name || entry.thread.id}
          </Badge>
        </>
      )}
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
