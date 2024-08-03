import React, { useCallback, useMemo, useState } from 'react'

import { ActionIcon, Group, MultiSelect, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { AutoSizer, List } from 'react-virtualized'
import {
  IconAlertTriangleFilled,
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconSearch,
} from '@tabler/icons-react'

import Alert from '../components/Alert'
import { LogEntryType, type LogParseResult } from '../../parser/types'
import { findNextIndexMatching, findPrevIndexMatching } from '../../utils/search'

import LogRow from './LogRow'

import classes from './Log.module.css'

interface LogProps {
  result: LogParseResult
}

const Log = (props: LogProps) => {
  const { result } = props

  // Filtering
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([])

  // Searching
  const [searchText, setSearchText] = useState('')
  const [searchIndex, setSearchIndex] = useState<number>()

  const { processes, entries } = result

  const filteredProcesses = useMemo(
    () =>
      selectedProcessIds.length
        ? processes.filter((process) => selectedProcessIds.includes(process.id))
        : processes,
    [processes, selectedProcessIds],
  )

  const filteredThreadIds = useMemo(
    () =>
      selectedThreadIds.length
        ? selectedThreadIds
        : filteredProcesses.flatMap((process) => process.threads.map((thread) => thread.id)),
    [selectedThreadIds, filteredProcesses],
  )

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        // Remove inlinable entries from log
        if (entry.type === LogEntryType.RETURN && entry.parent?.inlinable) {
          return false
        }

        if (!filteredProcesses.some((process) => process.id === entry.process.id)) {
          return false
        }

        if (!filteredThreadIds.includes(entry.thread.id)) {
          return false
        }

        return true
      }),
    [entries, filteredProcesses, filteredThreadIds],
  )

  const onChangeSearchText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.currentTarget.value)
    },
    [setSearchText],
  )

  const onSearchNextMatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const index = findNextIndexMatching(
        filtered,
        searchText,
        searchIndex !== undefined ? searchIndex + 1 : undefined,
      )
      setSearchIndex(index)
    },
    [filtered, searchText, searchIndex],
  )

  const onSearchPrevMatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const index = findPrevIndexMatching(
        filtered,
        searchText,
        searchIndex !== undefined ? searchIndex - 1 : undefined,
      )
      setSearchIndex(index)
    },
    [filtered, searchText, searchIndex],
  )

  if (!entries.length) {
    return (
      <Alert c="yellow" encourageBugReport icon={<IconAlertTriangleFilled />} showLimitations>
        <Text>This file does not seem to be a Wine log file.</Text>
      </Alert>
    )
  }

  return (
    <Stack flex={1}>
      <Group>
        <MultiSelect
          clearable
          data={processes.map((process) => ({
            value: process.id,
            label: process.name || process.id,
          }))}
          flex={1}
          onChange={setSelectedProcessIds}
          placeholder="Processes"
        />

        <MultiSelect
          clearable
          data={filteredProcesses.map((process) => ({
            group: `${process.name} (${process.id})`,
            items: process.threads.map((thread) => ({
              value: thread.id,
              label: thread.name || thread.id,
            })),
          }))}
          flex={1}
          onChange={setSelectedThreadIds}
          placeholder="Threads"
        />

        <form onSubmit={onSearchNextMatch} style={{ flex: 1 }}>
          <TextInput
            leftSection={<IconSearch size={16} />}
            onChange={onChangeSearchText}
            placeholder="Search"
            rightSection={
              <ActionIcon.Group mr="100%">
                <ActionIcon onClick={onSearchPrevMatch} disabled={!searchText} variant="default">
                  <Tooltip label="Prev Match" offset={10} withArrow>
                    <IconArrowNarrowUp size={16} stroke={1.5} />
                  </Tooltip>
                </ActionIcon>

                <ActionIcon onClick={onSearchNextMatch} disabled={!searchText} variant="default">
                  <Tooltip label="Next Match" offset={10} withArrow>
                    <IconArrowNarrowDown size={16} stroke={1.5} />
                  </Tooltip>
                </ActionIcon>
              </ActionIcon.Group>
            }
          />
        </form>
      </Group>

      <Stack flex={1}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              className={classes.list}
              width={width}
              height={height}
              overscanRowCount={15}
              rowCount={filtered.length}
              rowHeight={24}
              rowRenderer={({ key, style, index }) => (
                <LogRow
                  isCurrentSearchIndex={index === searchIndex}
                  entry={filtered[index]}
                  key={key}
                  searchText={searchText}
                  style={style}
                />
              )}
              scrollToAlignment="center"
              scrollToIndex={searchIndex}
            />
          )}
        </AutoSizer>
      </Stack>
    </Stack>
  )
}

export default Log
