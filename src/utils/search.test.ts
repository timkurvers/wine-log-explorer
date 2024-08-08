import { describe, expect, it } from 'vitest'

import { findNextIndexMatching, findPrevIndexMatching } from './search'
import { stripIndent } from './strings'
import parseWineLog from '../parser/parseWineLog'

const input = stripIndent`
  00c8:00cc:class:channel:logger message
  00c8:00cc:class:channel:logger message
  00c8:00cc:Call module.func(arg1,arg2) ret=ca11517e
  00c8:00cc:Ret  module.func() retval=1337 ret=ca11517e
  00c8:00cc:filler:filler:filler filler
`

const { entries } = await parseWineLog(input)

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
      expect(findNextIndexMatching(entries, 'ca11517e')).toEqual(2)

      expect(findNextIndexMatching(entries, '1337')).toEqual(3)
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
      expect(findPrevIndexMatching(entries, 'ca11517e')).toEqual(3)
      expect(findPrevIndexMatching(entries, '1337')).toEqual(3)
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
