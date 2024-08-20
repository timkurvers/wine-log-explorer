import { describe, expect, it } from 'vitest'

import { findNextIndexMatching, findPrevIndexMatching } from './search'
import { stripIndent } from './strings'
import parseWineLog from '../parser/parseWineLog'
import type { LogEntry } from '../parser/types'

const input = stripIndent`
  00c8:00cc:class:channel:logger message
  00c8:00bb:class:channel:logger message
  00c8:00cc:Call module.func(arg1,arg2) ret=ca11517e
  00c8:00cc:Ret  module.func() retval=1337 ret=ca11517e
  00c8:00cc:filler:filler:filler filler
`

const filterByThread00bb = (entry: LogEntry) => entry.thread.id === '00bb'
const filterByThread00cc = (entry: LogEntry) => entry.thread.id === '00cc'

const { entries } = await parseWineLog(input)

describe('search utilities', () => {
  describe('findNextIndexMatching()', () => {
    it('returns index of next matching entry', () => {
      // TODO: class not visible in UI: expect(findNextIndexMatching(entries, 'class')).toEqual(0)

      expect(findNextIndexMatching(entries, 'channel')).toEqual(0)
      expect(findNextIndexMatching(entries, 'logger')).toEqual(0)
      expect(findNextIndexMatching(entries, 'message')).toEqual(0)

      expect(findNextIndexMatching(entries, 'module')).toEqual(2)
      expect(findNextIndexMatching(entries, 'func')).toEqual(2)
      expect(findNextIndexMatching(entries, 'arg1')).toEqual(2)
      expect(findNextIndexMatching(entries, 'arg2')).toEqual(2)
      expect(findNextIndexMatching(entries, 'ca11517e')).toEqual(2)

      expect(findNextIndexMatching(entries, '1337')).toEqual(3)
    })

    it('searches case-insensitive', () => {
      expect(findNextIndexMatching(entries, 'MeSSaGe')).toEqual(0)
    })

    it('returns index of next matching entry given start and wraps around', () => {
      expect(findNextIndexMatching(entries, 'module', 1)).toEqual(2)
      expect(findNextIndexMatching(entries, 'module', 2)).toEqual(2)
      expect(findNextIndexMatching(entries, 'module', 3)).toEqual(3)
      expect(findNextIndexMatching(entries, 'module', 4)).toEqual(2)
    })

    it('returns undefined when no match', () => {
      expect(findNextIndexMatching(entries, 'non-existent')).toEqual(undefined)
    })

    describe('given a filter', () => {
      it('returns index of next matching entry given filter', () => {
        expect(findNextIndexMatching(entries, 'module', undefined, filterByThread00bb)).toEqual(undefined)
        expect(findNextIndexMatching(entries, 'module', undefined, filterByThread00cc)).toEqual(2)

        expect(findNextIndexMatching(entries, 'message', undefined, filterByThread00bb)).toEqual(1)
        expect(findNextIndexMatching(entries, 'message', 1, filterByThread00bb)).toEqual(1)
        expect(findNextIndexMatching(entries, 'message', 2, filterByThread00bb)).toEqual(1)
        expect(findNextIndexMatching(entries, 'message', 3, filterByThread00bb)).toEqual(1)
        expect(findNextIndexMatching(entries, 'message', 4, filterByThread00bb)).toEqual(1)

        expect(findNextIndexMatching(entries, 'message', undefined, filterByThread00cc)).toEqual(0)
        expect(findNextIndexMatching(entries, 'message', 1, filterByThread00cc)).toEqual(0)
        expect(findNextIndexMatching(entries, 'message', 2, filterByThread00cc)).toEqual(0)
        expect(findNextIndexMatching(entries, 'message', 3, filterByThread00cc)).toEqual(0)
        expect(findNextIndexMatching(entries, 'message', 4, filterByThread00cc)).toEqual(0)
      })
    })
  })

  describe('findPrevIndexMatching()', () => {
    it('returns index of prev matching entry (traverses entries in reverse)', () => {
      // TODO: class not visible in UI: expect(findPrevIndexMatching(entries, 'class')).toEqual(1)

      expect(findPrevIndexMatching(entries, 'channel')).toEqual(1)
      expect(findPrevIndexMatching(entries, 'logger')).toEqual(1)
      expect(findPrevIndexMatching(entries, 'message')).toEqual(1)

      expect(findPrevIndexMatching(entries, 'module')).toEqual(3)
      expect(findPrevIndexMatching(entries, 'func')).toEqual(3)
      expect(findPrevIndexMatching(entries, 'ca11517e')).toEqual(3)
      expect(findPrevIndexMatching(entries, '1337')).toEqual(3)
    })

    it('searches case-insensitive', () => {
      expect(findPrevIndexMatching(entries, 'MeSSaGe')).toEqual(1)
    })

    it('returns index of prev matching entry given start and wraps around', () => {
      expect(findPrevIndexMatching(entries, 'module', 1)).toEqual(3)
      expect(findPrevIndexMatching(entries, 'module', 2)).toEqual(2)
      expect(findPrevIndexMatching(entries, 'module', 3)).toEqual(3)
      expect(findPrevIndexMatching(entries, 'module', 4)).toEqual(3)
    })

    it('returns undefined when no match', () => {
      expect(findPrevIndexMatching(entries, 'non-existent')).toEqual(undefined)
    })

    describe('given a filter', () => {
      it('returns index of next matching entry given filter', () => {
        expect(findPrevIndexMatching(entries, 'module', undefined, filterByThread00bb)).toEqual(undefined)
        expect(findPrevIndexMatching(entries, 'module', undefined, filterByThread00cc)).toEqual(3)

        expect(findPrevIndexMatching(entries, 'message', undefined, filterByThread00bb)).toEqual(1)
        expect(findPrevIndexMatching(entries, 'message', 1, filterByThread00bb)).toEqual(1)
        expect(findPrevIndexMatching(entries, 'message', 2, filterByThread00bb)).toEqual(1)
        expect(findPrevIndexMatching(entries, 'message', 3, filterByThread00bb)).toEqual(1)
        expect(findPrevIndexMatching(entries, 'message', 4, filterByThread00bb)).toEqual(1)

        expect(findPrevIndexMatching(entries, 'message', undefined, filterByThread00cc)).toEqual(0)
        expect(findPrevIndexMatching(entries, 'message', 1, filterByThread00cc)).toEqual(0)
        expect(findPrevIndexMatching(entries, 'message', 2, filterByThread00cc)).toEqual(0)
        expect(findPrevIndexMatching(entries, 'message', 3, filterByThread00cc)).toEqual(0)
        expect(findPrevIndexMatching(entries, 'message', 4, filterByThread00cc)).toEqual(0)
      })
    })
  })
})
