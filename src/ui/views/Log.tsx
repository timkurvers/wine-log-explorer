import React, { useState } from 'react'

import { Group, MultiSelect, RingProgress, Stack, Text } from '@mantine/core'
import { AutoSizer, List } from 'react-virtualized'

import parseWineLog from '../../parser/parseWineLog'
import { LogEntryType } from '../../parser/types'
import { useAsyncEffect } from '../hooks'
import type { LogFile } from '../types'

import LogRow from './LogRow'
import classes from './Log.module.css'

interface LogProps {
  file: LogFile
}

const Log = (props: LogProps) => {
  const { file } = props

  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)

  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([])

  // TODO: Abort parsing on unmount

  useAsyncEffect(async () => {
    if (file.result) {
      return
    }

    file.result = await parseWineLog(file.file, {
      onReadProgress(bytesRead: number) {
        setProgress((bytesRead / file.file.size) * 100)
      },
    })

    setReady(true)
  }, [])

  if (!ready) {
    return (
      <Stack flex={1} justify="center" align="center">
        <RingProgress
          label={
            <Text c="blue" size="xl" ta="center">
              {Math.ceil(progress)}%
            </Text>
          }
          sections={[{ value: progress, color: 'blue' }]}
          size={180}
          thickness={15}
          roundCaps
        />

        <Text c="dimmed" size="md" ta="center">
          Parsing log file...
        </Text>
      </Stack>
    )
  }

  const { processes, entries } = file.result!

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

  return (
    <Stack className={classes.root}>
      <Group>
        <MultiSelect
          placeholder="Processes"
          data={processes.map((process) => ({
            value: process.id,
            label: process.name || process.id,
          }))}
          onChange={setSelectedProcessIds}
          clearable
          flex={1}
        />
        <MultiSelect
          placeholder="Threads"
          data={filteredProcesses.map((process) => ({
            group: `${process.name} (${process.id})`,
            items: process.threads.map((thread) => ({
              value: thread.id,
              label: thread.name || thread.id,
            })),
          }))}
          onChange={setSelectedThreadIds}
          clearable
          flex={1}
        />
      </Group>

      <div className={classes.listContainer}>
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
      </div>
    </Stack>
  )
}

export default Log
