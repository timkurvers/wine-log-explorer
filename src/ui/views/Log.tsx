import React, { useState } from 'react'

import { Group, MultiSelect, Stack, Text } from '@mantine/core'
import { AutoSizer, List } from 'react-virtualized'
import { IconAlertTriangleFilled } from '@tabler/icons-react'

import Alert from '../components/Alert'
import { LogEntryType, type LogParseResult } from '../../parser/types'

import LogRow from './LogRow'

interface LogProps {
  result: LogParseResult
}

const Log = (props: LogProps) => {
  const { result } = props

  // Filtering
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([])

  const { processes, entries } = result

  const filteredProcesses = selectedProcessIds.length
    ? processes.filter((process) => selectedProcessIds.includes(process.id))
    : processes

  const filteredThreadIds = selectedThreadIds.length
    ? selectedThreadIds
    : filteredProcesses.flatMap((process) => process.threads.map((thread) => thread.id))

  const filtered = entries.filter((entry) => {
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
  })

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
      </Group>

      <Stack flex={1}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              width={width}
              height={height}
              overscanRowCount={30}
              rowCount={filtered.length}
              rowHeight={24}
              rowRenderer={({ key, style, index }) => (
                <LogRow key={key} style={style} entry={filtered[index]} />
              )}
            />
          )}
        </AutoSizer>
      </Stack>
    </Stack>
  )
}

export default Log
