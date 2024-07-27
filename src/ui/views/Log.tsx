import React, { useState } from 'react'

import { MultiSelect, RingProgress, Stack, Text } from '@mantine/core'
import { AutoSizer, List } from 'react-virtualized'

import parseWineLog from '../../parser/parseWineLog'
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

  // TODO: Support filtering (by process, thread, message text, class, channel etc)

  return (
    <Stack className={classes.root}>
      <MultiSelect
        data={processes.map((process) => ({
          value: process.id,
          label: process.name || process.id,
        }))}
      />
      <div className={classes.listContainer}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              width={width}
              height={height}
              overscanRowCount={30}
              rowCount={entries.length}
              rowHeight={28}
              rowRenderer={({ key, style, index }) => (
                <LogRow key={key} style={style} entry={entries[index]} />
              )}
            />
          )}
        </AutoSizer>
      </div>
    </Stack>
  )
}

export default Log
