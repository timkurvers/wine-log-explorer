import React, { useRef, useState } from 'react'

import { RingProgress, Stack, Text } from '@mantine/core'

import Error from '../components/Error'
import Worker from '../../workers/WineLogParser.worker?worker'
import { useAsyncEffect } from '../hooks'
import type { LogFile } from '../types'
import type { LogParseResult } from '../../parser/types'
import type { WorkerOutputMessageEvent } from '../../workers/WineLogParser.worker'

import Log from './Log'

interface LogLoaderProps {
  file: LogFile
}

const LogLoader = (props: LogLoaderProps) => {
  const { file } = props

  const [result, setResult] = useState<LogParseResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

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

  if (!result) {
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
      </Stack>
    )
  }

  return <Log result={result} />
}

export default LogLoader
