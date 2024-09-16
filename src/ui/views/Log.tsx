/* eslint-disable react/display-name */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import AutoSizer from 'react-virtualized-auto-sizer'
import { ActionIcon, Group, MultiSelect, Stack, Text, TextInput, Tooltip } from '@mantine/core'
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window'
import {
  IconAlertTriangleFilled,
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconCpu,
  IconNeedleThread,
  IconSearch,
} from '@tabler/icons-react'

import Alert from '../components/Alert'
import {
  LogEntry,
  type LogEntryCall,
  LogEntryType,
  type LogParseResult,
  type pid,
  type tid,
} from '../../parser/types'
import { findNextIndexMatching, findPrevIndexMatching } from '../../utils/search'
import { compactTree, compactTreeForCall } from '../../utils/tree'

import LogRow from './LogRow'

interface LogProps {
  result: LogParseResult
}

const Log = (props: LogProps) => {
  const { result } = props
  const { processes, entries } = result

  // Filtering
  const [selectedProcessIds, setSelectedProcessIds] = useState<pid[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<tid[]>([])

  // Searching
  const [searchText, setSearchText] = useState('')
  const [searchIndex, setSearchIndex] = useState<number>()
  const [searchNotFound, setSearchNotFound] = useState(false)
  const [visibleSearchIndex, setVisibleSearchIndex] = useState<number>()

  // Reference to virtualized list to facilitate for tree expansion and scrolling to entries
  const listRef = useRef<List>(null)

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

  const activeFilter = useCallback(
    (entry: LogEntry) => {
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
    },
    [filteredProcesses, filteredThreadIds],
  )

  // Visible entries matching active filter and part of expanded call trees
  const [visible, setVisibleEntries] = useState<LogEntry[]>([])

  // Applies the initial filtering on mount, too
  useEffect(() => {
    setVisibleEntries(compactTree(entries, activeFilter))
  }, [filteredProcesses, filteredThreadIds])

  const onChangeSearchText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.currentTarget.value)
      setSearchNotFound(false)
    },
    [setSearchText],
  )

  const onSearchNextMatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!searchText) return

      const index = findNextIndexMatching(
        entries,
        searchText,
        searchIndex !== undefined ? searchIndex + 1 : undefined,
        activeFilter,
      )
      setSearchIndex(index)
      if (index === undefined) {
        setSearchNotFound(true)
      }
    },
    [activeFilter, entries, searchText, searchIndex],
  )

  const onSearchPrevMatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!searchText) return

      const index = findPrevIndexMatching(
        entries,
        searchText,
        searchIndex !== undefined ? searchIndex - 1 : undefined,
        activeFilter,
      )
      setSearchIndex(index)
      if (index === undefined) {
        setSearchNotFound(true)
      }
    },
    [activeFilter, entries, searchText, searchIndex],
  )

  const onToggleExpansion = useCallback(
    (index: number) => {
      const entry = visible[index]
      if (entry.type !== LogEntryType.CALL) {
        return
      }

      // Toggle expanded state
      entry.isExpanded = !entry.isExpanded

      // Ensure room is made for / taken from the sub entries of this call entry
      const next = compactTreeForCall(visible, entries, entry, activeFilter)
      setVisibleEntries(next)
    },
    [activeFilter, entries, visible],
  )

  useEffect(() => {
    if (searchIndex === undefined) return

    const entry = entries[searchIndex]

    // TODO: Likely some race conditions here (depending on how fast the search is executed)
    let next = visible
    let visibleSearchIndex = visible.indexOf(entry)

    // Ensure the entire ancestor hierarchy is expanded when search entry is not yet visible
    if (visibleSearchIndex === -1) {
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
        next = compactTreeForCall(visible, entries, ancestorToExpand, activeFilter)
      }
      visibleSearchIndex = next.indexOf(entry)
    }

    if (visibleSearchIndex !== -1) {
      setVisibleEntries(next)
      setVisibleSearchIndex(visibleSearchIndex)
    } else {
      setVisibleSearchIndex(undefined)
    }
  }, [entries, searchIndex])

  useEffect(() => {
    if (visibleSearchIndex === undefined) return

    // Scroll to search index
    listRef.current?.scrollToItem(visibleSearchIndex, 'center')
  }, [visibleSearchIndex])

  if (!result.entries.length) {
    return (
      <Alert c="yellow" encourageBugReport icon={<IconAlertTriangleFilled />} showLimitations>
        <Text>This file does not seem to be a Wine log file.</Text>
      </Alert>
    )
  }

  const createLogRow = useMemo(() => {
    return ({ index, style }: ListChildComponentProps) => (
      <LogRow
        isCurrentSearchIndex={index === visibleSearchIndex}
        entry={visible[index]}
        searchText={searchText}
        style={style}
        toggleExpansion={() => onToggleExpansion(index)}
      />
    )
  }, [searchText, visible, visibleSearchIndex])

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
          leftSection={<IconCpu size={18} />}
          onChange={setSelectedProcessIds}
          placeholder="Processes"
          searchable
        />

        <MultiSelect
          clearable
          data={filteredProcesses.map((process) => ({
            group: process.name ? `${process.name} (${process.id})` : process.id,
            items: process.threads.map((thread) => ({
              value: thread.id,
              label: thread.name || thread.id,
            })),
          }))}
          flex={1}
          leftSection={<IconNeedleThread size={18} />}
          onChange={setSelectedThreadIds}
          placeholder="Threads"
          searchable
        />

        <form onSubmit={onSearchNextMatch} style={{ flex: 1 }}>
          <TextInput
            error={searchNotFound}
            leftSection={<IconSearch size={18} />}
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
              overscanCount={15}
              ref={listRef}
              itemCount={visible.length}
              itemSize={24}
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
