import React, { useRef, useState } from 'react'

import { Code, Group, MultiSelect, RingProgress, Stack, Text } from '@mantine/core'
import { AutoSizer, List } from 'react-virtualized'
import { IconAlertTriangleFilled } from '@tabler/icons-react'

import Alert from '../components/Alert'
import Error from '../components/Error'
import Worker from '../../workers/WineLogParser.worker?worker'
import { LogEntryType, LogParseResult } from '../../parser/types'
import { useAsyncEffect } from '../hooks'
import type { LogFile } from '../types'
import type { WorkerOutputMessageEvent } from '../../workers/WineLogParser.worker'

import LogRow from './LogRow'
import classes from './Log.module.css'

interface LogProps {
  file: LogFile
}

const Log = (props: LogProps) => {
  const { file } = props

  const [result, setResult] = useState<LogParseResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([])
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([])

  // Hold a reference to worker thread
  const workerRef = useRef<Worker | null>(null)

  useAsyncEffect(
    async () => {
      // Use a separate worker thread for Wine log parsing
      const worker = new Worker()
      workerRef.current = worker

      worker.addEventListener('error', (e: ErrorEvent) => {
        setError(e.error)
        worker.terminate()
      })

      worker.addEventListener('message', (message: WorkerOutputMessageEvent) => {
        const { data } = message
        if (data.type === 'progress') {
          const progress = (data.bytesRead / file.file.size) * 100
          setProgress(progress)
        } else if (data.type === 'error') {
          setError(data.error)
          worker.terminate()
        } else if (data.type === 'complete') {
          worker.terminate()
          setResult(data.result)
        }
      })

      // Have to transfer File here, as Safari does not support transferring ReadableStream
      // See: https://bugs.webkit.org/show_bug.cgi?id=262531
      worker.postMessage(file.file)
    },
    () => {
      // Clean up worker when component unmounts
      workerRef.current?.terminate()
    },
    [file],
  )

  if (!result || !result.entries.length) {
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
          {progress < 100 ? <>Parsing log file...</> : <>Preparing log...</>}
        </Text>

        {error && <Error error={error} />}

        {result && !result.entries.length && (
          <Alert c="yellow" encourageBugReport icon={<IconAlertTriangleFilled />} showLimitations>
            <Text>This file does not seem to be a Wine log file.</Text>
          </Alert>
        )}
      </Stack>
    )
  }

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
