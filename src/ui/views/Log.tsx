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
import ToggleButton from '../components/ToggleButton'
import { LogFilterType, LogFilterTypes } from '../types'
import {
  LogEntry,
  type LogEntryCall,
  LogEntryType,
  type LogParseResult,
  LogProcess,
  LogThread,
  type pid,
  type tid,
} from '../../parser/types'
import {
  compactTree,
  compactTreeForCall,
  enumRecordFor,
  enumValuesFor,
  findIndexMatching,
  SearchDirection,
} from '../../utils'

import LogRow from './LogRow'

import classes from './Text.module.css'

const labelFor = (processOrThread: LogProcess | LogThread) => {
  return processOrThread.name ? `${processOrThread.name} (${processOrThread.id})` : processOrThread.id
}

interface LogProps {
  result: LogParseResult
}

const Log = (props: LogProps) => {
  const { result } = props
  const { processes, entries } = result

  // Filtering
  const [selectedTypes, setSelectedTypes] = useState(enumRecordFor(LogFilterType, () => true))
  const [selectedProcessIds, setSelectedProcessIds] = useState<pid[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<tid[]>([])

  const toggleSelectedType = useCallback((type: LogFilterType) => {
    setSelectedTypes((current) => ({ ...current, [type]: !current[type] }))
  }, [])

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
        : filteredProcesses.flatMap((process) =>
            process.threads.map((thread) => `${process.id}:${thread.id}`),
          ),
    [selectedThreadIds, filteredProcesses],
  )

  const activeFilter = useCallback(
    (entry: LogEntry) => {
      // Remove inlinable entries from log
      if (entry.type === LogEntryType.RETURN && entry.parent?.inlinable) {
        return false
      }

      // Hide text entries when requested
      if (entry.type === LogEntryType.TEXT && !selectedTypes[LogFilterType.TEXT]) {
        return false
      }

      // Hide relay (call/ret) entries when requested
      if (
        (entry.type === LogEntryType.CALL || entry.type === LogEntryType.RETURN) &&
        !selectedTypes[LogFilterType.RELAY]
      ) {
        return false
      }

      // Hide matching Wine debug class (fixme, err, warn, debug) entries when requested
      if (!entry.type && entry.class in selectedTypes && !selectedTypes[entry.class as LogFilterType]) {
        return false
      }

      // Ensure process / thread is relevant for non-text entries
      if (entry.type !== LogEntryType.TEXT) {
        if (!filteredProcesses.some((process) => process.id === entry.process.id)) {
          return false
        }

        if (!filteredThreadIds.includes(`${entry.process.id}:${entry.thread.id}`)) {
          return false
        }
      }

      return true
    },
    [filteredProcesses, filteredThreadIds, selectedTypes],
  )

  // Visible entries matching active filter and part of expanded call trees
  const [visible, setVisibleEntries] = useState<LogEntry[]>([])

  // Applies the initial filtering on mount, too
  useEffect(() => {
    setVisibleEntries(compactTree(entries, activeFilter))
  }, [filteredProcesses, filteredThreadIds, selectedTypes])

  const onChangeSearchText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.currentTarget.value)
      setSearchNotFound(false)
    },
    [setSearchText],
  )

  const search = useCallback(
    (direction: SearchDirection) => {
      if (!searchText) return

      const index = findIndexMatching(
        entries,
        searchText,
        direction,
        searchIndex !== undefined ? searchIndex + (direction === SearchDirection.NEXT ? 1 : -1) : undefined,
        activeFilter,
      )

      // Keep track of search index for next invocation
      setSearchIndex(index)

      if (index === undefined) {
        setSearchNotFound(true)
        return
      }

      const entry = entries[index]

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
    },
    [activeFilter, entries, searchText, searchIndex],
  )

  const onSearchNextMatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      search(SearchDirection.NEXT)
    },
    [search],
  )

  const onSearchPrevMatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      search(SearchDirection.PREV)
    },
    [search],
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
        <ToggleButton.Group>
          {enumValuesFor(LogFilterType).map((filterType) => (
            <ToggleButton
              active={selectedTypes[filterType]}
              c={LogFilterTypes[filterType].color}
              key={filterType}
              onClick={toggleSelectedType.bind(null, filterType)}
              tooltip={LogFilterTypes[filterType].label}
            >
              {React.createElement(LogFilterTypes[filterType].icon, { size: 18 })}
            </ToggleButton>
          ))}
        </ToggleButton.Group>

        <MultiSelect
          clearable
          data={processes.map((process) => ({
            value: process.id,
            label: labelFor(process),
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
            group: labelFor(process),
            items: process.threads.map((thread) => ({
              value: `${process.id}:${thread.id}`,
              label: labelFor(thread),
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
        {visible.length ? (
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
        ) : (
          <Text className={classes.text} c="dimmed">
            No log entries match the current filter(s)
          </Text>
        )}
      </Stack>
    </Stack>
  )
}

export default Log
