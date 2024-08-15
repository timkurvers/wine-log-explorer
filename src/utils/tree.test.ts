import { beforeEach, describe, expect, it } from 'vitest'

import parseWineLog from '../parser/parseWineLog'

import { calculateDepth, compactTree, compactTreeForCall, isVisible } from './tree'
import { stripIndent } from './strings'
import { LogEntry, LogEntryCall } from '../parser/types'

const input = stripIndent`
  00c8:00cc:class:channel:logger message 0
  00c8:00cc:Call mod.func(arg1,arg2) ret=0
  00c8:00cc:class:channel:logger message 1
  00c8:00cc:Call innermod.func() ret=1
  00c8:00cc:class:channel:logger message 2
  00c8:00cc:class:channel:logger message 3
  00c8:00bb:class:channel:logger message alt.1 (different thread, not part of call tree)
  00c8:00bb:class:channel:logger message alt.2 (different thread, too)
  00c8:00cc:Ret innermod.func() retval=0 ret=1
  00c8:00cc:class:channel:logger message 4
  00c8:00cc:Ret  mod.func() retval=0 ret=0
  00c8:00cc:class:channel:logger message 5
  00c8:00bb:class:channel:logger message alt.3 (different thread, too)
`

const filterByThread = (entry: LogEntry) => entry.thread.id === '00cc'

const { entries } = await parseWineLog(input)

const [
  msg0,
  ,
  __msg1,
  ,
  ____msg2,
  ____msg3,
  altMsg1,
  altMsg2,
  ____innermodFuncRet,
  __msg4,
  __modFuncRet,
  msg5,
  altMsg3,
] = entries

const modFuncCall = entries[1] as LogEntryCall
const __innermodFuncCall = entries[3] as LogEntryCall

beforeEach(() => {
  modFuncCall.isExpanded = false
  __innermodFuncCall.isExpanded = false
})

describe('tree utilities', () => {
  describe('calculateDepth()', () => {
    it('returns tree depth for given entry', () => {
      expect(calculateDepth(msg0)).toEqual(0)
      expect(calculateDepth(modFuncCall)).toEqual(0)
      expect(calculateDepth(__msg1)).toEqual(1)
      expect(calculateDepth(__innermodFuncCall)).toEqual(1)
      expect(calculateDepth(____msg2)).toEqual(2)
      expect(calculateDepth(____msg3)).toEqual(2)
      expect(calculateDepth(__msg4)).toEqual(1)
      expect(calculateDepth(msg5)).toEqual(0)

      // Return entries are at the same depth as the initial call
      expect(calculateDepth(____innermodFuncRet)).toEqual(1)
      expect(calculateDepth(__modFuncRet)).toEqual(0)

      // Entries in different threads are not affected by call tree
      expect(calculateDepth(altMsg1)).toEqual(0)
      expect(calculateDepth(altMsg2)).toEqual(0)
      expect(calculateDepth(altMsg3)).toEqual(0)
    })
  })

  describe('isVisible()', () => {
    it('returns whether given entry is visible in tree hierarchy', () => {
      expect(isVisible(msg0)).toBe(true)
      expect(isVisible(modFuncCall)).toBe(true)
      expect(isVisible(__msg1)).toBe(false)
      expect(isVisible(__innermodFuncCall)).toBe(false)
      expect(isVisible(____msg2)).toBe(false)
      expect(isVisible(____msg3)).toBe(false)
      expect(isVisible(____innermodFuncRet)).toBe(false)
      expect(isVisible(__msg4)).toBe(false)
      expect(isVisible(__modFuncRet)).toBe(false)
      expect(isVisible(msg5)).toBe(true)

      expect(calculateDepth(altMsg1)).toEqual(0)
      expect(calculateDepth(altMsg2)).toEqual(0)
      expect(calculateDepth(altMsg3)).toEqual(0)

      // This should not make a difference, as ancestors are stil hidden
      __innermodFuncCall.isExpanded = true

      expect(isVisible(msg0)).toBe(true)
      expect(isVisible(modFuncCall)).toBe(true)
      expect(isVisible(__msg1)).toBe(false)
      expect(isVisible(__innermodFuncCall)).toBe(false)
      expect(isVisible(____msg2)).toBe(false)
      expect(isVisible(____msg3)).toBe(false)
      expect(isVisible(____innermodFuncRet)).toBe(false)
      expect(isVisible(__msg4)).toBe(false)
      expect(isVisible(__modFuncRet)).toBe(false)
      expect(isVisible(msg5)).toBe(true)

      expect(calculateDepth(altMsg1)).toEqual(0)
      expect(calculateDepth(altMsg2)).toEqual(0)
      expect(calculateDepth(altMsg3)).toEqual(0)

      // Now the entire tree is visible
      modFuncCall.isExpanded = true

      expect(isVisible(msg0)).toBe(true)
      expect(isVisible(modFuncCall)).toBe(true)
      expect(isVisible(__msg1)).toBe(true)
      expect(isVisible(__innermodFuncCall)).toBe(true)
      expect(isVisible(____msg2)).toBe(true)
      expect(isVisible(____msg3)).toBe(true)
      expect(isVisible(____innermodFuncRet)).toBe(true)
      expect(isVisible(__msg4)).toBe(true)
      expect(isVisible(__modFuncRet)).toBe(true)
      expect(isVisible(msg5)).toBe(true)

      expect(calculateDepth(altMsg1)).toEqual(0)
      expect(calculateDepth(altMsg2)).toEqual(0)
      expect(calculateDepth(altMsg3)).toEqual(0)

      // Hide the inner call again
      __innermodFuncCall.isExpanded = false

      expect(isVisible(msg0)).toBe(true)
      expect(isVisible(modFuncCall)).toBe(true)
      expect(isVisible(__msg1)).toBe(true)
      expect(isVisible(__innermodFuncCall)).toBe(true)
      expect(isVisible(____msg2)).toBe(false)
      expect(isVisible(____msg3)).toBe(false)
      expect(isVisible(____innermodFuncRet)).toBe(false)
      expect(isVisible(__msg4)).toBe(true)
      expect(isVisible(__modFuncRet)).toBe(true)
      expect(isVisible(msg5)).toBe(true)

      expect(calculateDepth(altMsg1)).toEqual(0)
      expect(calculateDepth(altMsg2)).toEqual(0)
      expect(calculateDepth(altMsg3)).toEqual(0)
    })
  })

  describe('compactTree()', () => {
    it('compacts given list of entries without any call subtrees', () => {
      const visible = compactTree(entries)
      expect(visible).toEqual([msg0, modFuncCall, altMsg1, altMsg2, msg5, altMsg3])
    })

    describe('given a filter', () => {
      it('compacts given list of entries without any call subtrees + only entries matching given filter', () => {
        const visibleAndFiltered = compactTree(entries, filterByThread)
        expect(visibleAndFiltered).toEqual([msg0, modFuncCall, msg5])
      })
    })
  })

  describe('compactTreeForCall()', () => {
    it('compacts given list of entries focusing on subtree for provided call', () => {
      let visible = compactTree(entries)

      // This should not make a difference, as ancestors are stil hidden
      __innermodFuncCall.isExpanded = true
      visible = compactTreeForCall(visible, entries, __innermodFuncCall)

      expect(visible).toEqual([msg0, modFuncCall, altMsg1, altMsg2, msg5, altMsg3])

      // Now the entire tree is visible
      modFuncCall.isExpanded = true
      visible = compactTreeForCall(visible, entries, modFuncCall)

      expect(visible).toEqual([
        msg0,
        modFuncCall,
        __msg1,
        __innermodFuncCall,
        ____msg2,
        ____msg3,
        altMsg1,
        altMsg2,
        ____innermodFuncRet,
        __msg4,
        __modFuncRet,
        msg5,
        altMsg3,
      ])

      // Hide the inner call again
      __innermodFuncCall.isExpanded = false
      visible = compactTreeForCall(visible, entries, __innermodFuncCall)

      expect(visible).toEqual([
        msg0,
        modFuncCall,
        __msg1,
        __innermodFuncCall,
        altMsg1,
        altMsg2,
        __msg4,
        __modFuncRet,
        msg5,
        altMsg3,
      ])
    })

    describe('given a filter', () => {
      it('compacts given list of entries focusing on subtree for provided call + only entries matching given filter', () => {
        let visibleAndFiltered = compactTree(entries, filterByThread)

        // This should not make a difference, as ancestors are stil hidden
        __innermodFuncCall.isExpanded = true
        visibleAndFiltered = compactTreeForCall(
          visibleAndFiltered,
          entries,
          __innermodFuncCall,
          filterByThread,
        )

        expect(visibleAndFiltered).toEqual([msg0, modFuncCall, msg5])

        // Now the entire tree is visible
        modFuncCall.isExpanded = true
        visibleAndFiltered = compactTreeForCall(visibleAndFiltered, entries, modFuncCall, filterByThread)

        expect(visibleAndFiltered).toEqual([
          msg0,
          modFuncCall,
          __msg1,
          __innermodFuncCall,
          ____msg2,
          ____msg3,
          ____innermodFuncRet,
          __msg4,
          __modFuncRet,
          msg5,
        ])

        // Hide the inner call again
        __innermodFuncCall.isExpanded = false
        visibleAndFiltered = compactTreeForCall(
          visibleAndFiltered,
          entries,
          __innermodFuncCall,
          filterByThread,
        )

        expect(visibleAndFiltered).toEqual([
          msg0,
          modFuncCall,
          __msg1,
          __innermodFuncCall,
          __msg4,
          __modFuncRet,
          msg5,
        ])
      })
    })
  })
})
