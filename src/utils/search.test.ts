import { describe, expect, it } from 'vitest'

import { type LogEntry, LogEntryType, type LogProcess } from '../parser/types'
import { findNextIndexMatching, findPrevIndexMatching } from './search'

const processes: LogProcess[] = [
  {
    id: '00c8',
    name: null,
    threads: [
      {
        id: '00cc',
        name: null,
      },
    ],
  },
]

const process = processes[0]
const thread = process.threads[0]

const entries: LogEntry[] = [
  {
    id: 0,
    process,
    thread,
    class: 'class',
    channel: 'channel',
    logger: 'logger',
    message: 'message',
  },
  {
    id: 1,
    type: LogEntryType.MESSAGE,
    process,
    thread,
    class: 'class',
    channel: 'channel',
    logger: 'logger',
    message: 'message',
  },
  {
    id: 2,
    type: LogEntryType.CALL,
    process,
    thread,
    module: 'module',
    func: 'func',
    args: ['arg1', 'arg2'],
    callsite: 'callsite',
  },
  {
    id: 3,
    type: LogEntryType.RETURN,
    process,
    thread,
    module: 'module',
    func: 'func',
    callsite: 'callsite',
    retval: 'retval',
  },
  {
    id: 4,
    type: LogEntryType.MESSAGE,
    process,
    thread,
    class: 'filler',
    channel: 'filler',
    logger: 'filler',
    message: 'filler',
  },
]

describe('search utilities', () => {
  describe('findNextIndexMatching()', () => {
    it('returns index of next matching item', () => {
      // TODO: expect(findNextIndexMatching(entries, 'class')).toEqual(0)

      expect(findNextIndexMatching(entries, 'channel')).toEqual(0)
      expect(findNextIndexMatching(entries, 'logger')).toEqual(0)
      expect(findNextIndexMatching(entries, 'message')).toEqual(0)

      expect(findNextIndexMatching(entries, 'module')).toEqual(2)
      expect(findNextIndexMatching(entries, 'func')).toEqual(2)
      expect(findNextIndexMatching(entries, 'arg1')).toEqual(2)
      expect(findNextIndexMatching(entries, 'arg2')).toEqual(2)
      expect(findNextIndexMatching(entries, 'callsite')).toEqual(2)

      expect(findNextIndexMatching(entries, 'retval')).toEqual(3)
    })

    it('searches case-insensitive', () => {
      expect(findNextIndexMatching(entries, 'MeSSaGe')).toEqual(0)
    })

    it('returns index of next matching item given start and wraps around', () => {
      expect(findNextIndexMatching(entries, 'module', 1)).toEqual(2)
      expect(findNextIndexMatching(entries, 'module', 2)).toEqual(2)
      expect(findNextIndexMatching(entries, 'module', 3)).toEqual(3)
      expect(findNextIndexMatching(entries, 'module', 4)).toEqual(2)
    })

    it('returns undefined when no match', () => {
      expect(findNextIndexMatching(entries, 'non-existent')).toEqual(undefined)
    })
  })

  describe('findPrevIndexMatching()', () => {
    it('returns index of prev matching item (traverses entries in reverse)', () => {
      // TODO: expect(findPrevIndexMatching(entries, 'class')).toEqual(1)

      expect(findPrevIndexMatching(entries, 'channel')).toEqual(1)
      expect(findPrevIndexMatching(entries, 'logger')).toEqual(1)
      expect(findPrevIndexMatching(entries, 'message')).toEqual(1)

      expect(findPrevIndexMatching(entries, 'module')).toEqual(3)
      expect(findPrevIndexMatching(entries, 'func')).toEqual(3)
      expect(findPrevIndexMatching(entries, 'callsite')).toEqual(3)
      expect(findPrevIndexMatching(entries, 'retval')).toEqual(3)
    })

    it('searches case-insensitive', () => {
      expect(findPrevIndexMatching(entries, 'MeSSaGe')).toEqual(1)
    })

    it('returns index of prev matching item given start and wraps around', () => {
      expect(findPrevIndexMatching(entries, 'module', 1)).toEqual(3)
      expect(findPrevIndexMatching(entries, 'module', 2)).toEqual(2)
      expect(findPrevIndexMatching(entries, 'module', 3)).toEqual(3)
      expect(findPrevIndexMatching(entries, 'module', 4)).toEqual(3)
    })

    it('returns undefined when no match', () => {
      expect(findPrevIndexMatching(entries, 'non-existent')).toEqual(undefined)
    })
  })
})
