/* eslint-disable react/display-name */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import AutoSizer from 'react-virtualized-auto-sizer'
import { ActionIcon, Group, MultiSelect, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { type ListChildComponentProps, VariableSizeList as List } from 'react-window'
import {
  IconAlertTriangleFilled,
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconSearch,
} from '@tabler/icons-react'

import Alert from '../components/Alert'
import { LogEntryCall, LogEntryType, type LogParseResult, type pid, type tid } from '../../parser/types'
import { findNextIndexMatching, findPrevIndexMatching } from '../../utils/search'
import { isVisible } from '../../utils/tree'

import LogRow from './LogRow'

interface LogProps {
  result: LogParseResult
}

const Log = (props: LogProps) => {
  const { result } = props

  // Filtering
  const [selectedProcessIds, setSelectedProcessIds] = useState<pid[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<tid[]>([])

  // Searching
  const [searchText, setSearchText] = useState('')
  const [searchIndex, setSearchIndex] = useState<number>()

  // Reference to virtualized list to facilitate for tree expansion and scrolling to entries
  const listRef = useRef<List>(null)

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

  const onToggleExpansion = useCallback(
    (index: number) => {
      const entry = filtered[index]
      if (entry.type !== LogEntryType.CALL) {
        return
      }

      // Toggle expanded state
      entry.isExpanded = !entry.isExpanded

      // Ensure room is made for / taken from the sub entries of this call entry
      listRef.current?.resetAfterIndex(index)
    },
    [filtered],
  )

  useEffect(() => {
    if (searchIndex === undefined) return

    const entry = filtered[searchIndex]
    if (!entry) return

    // Ensure the entire ancestor hierarchy is expanded and re-rendered when necessary
    let current = entry.parent
    let ancestorToExpand: LogEntryCall | null = null
    while (current) {
      if (!current.isExpanded) {
        current.isExpanded = true
        ancestorToExpand = current
      }
      current = current.parent
    }
    if (ancestorToExpand) {
      listRef.current?.resetAfterIndex(filtered.indexOf(ancestorToExpand))
    }

    // Scroll to search index
    listRef.current?.scrollToItem(searchIndex, 'center')
  }, [searchIndex])

  useEffect(() => {
    // When the the list of entries is filtered anew, react-window breaks, so re-render the virtualized list
    listRef.current?.resetAfterIndex(0)
  }, [filtered])

  if (!entries.length) {
    return (
      <Alert c="yellow" encourageBugReport icon={<IconAlertTriangleFilled />} showLimitations>
        <Text>This file does not seem to be a Wine log file.</Text>
      </Alert>
    )
  }

  const createLogRow = useMemo(() => {
    return ({ index, style }: ListChildComponentProps) => (
      <LogRow
        isCurrentSearchIndex={index === searchIndex}
        entry={filtered[index]}
        searchText={searchText}
        style={style}
        toggleExpansion={() => onToggleExpansion(index)}
      />
    )
  }, [filtered, searchText, searchIndex])

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
              width={width}
              height={height}
              estimatedItemSize={24}
              overscanCount={15}
              ref={listRef}
              itemCount={filtered.length}
              itemKey={(index) => `${filtered[index].id}-${index}`}
              itemSize={(index) => (isVisible(filtered[index]) ? 24 : 0)}
            >
              {createLogRow}
            </List>
          )}
        </AutoSizer>
      </Stack>
    </Stack>
  )
}

export default Log
