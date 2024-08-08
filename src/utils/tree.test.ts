import { describe, expect, it } from 'vitest'

import parseWineLog from '../parser/parseWineLog'

import { calculateDepth, isVisible } from './tree'
import { stripIndent } from './strings'
import { LogEntryCall } from '../parser/types'

const input = stripIndent`
  00c8:00cc:class:channel:logger message 0
  00c8:00cc:Call mod.func(arg1,arg2) ret=0
  00c8:00cc:class:channel:logger message 1
  00c8:00cc:Call innermod.func() ret=1
  00c8:00cc:class:channel:logger message 2
  00c8:00cc:class:channel:logger message 3
  00c8:00cc:Ret innermod.func() retval=0 ret=1
  00c8:00cc:class:channel:logger message 4
  00c8:00cc:Ret  mod.func() retval=0 ret=0
  00c8:00cc:class:channel:logger message 5
`

const { entries } = await parseWineLog(input)

const [msg0, , __msg1, , ____msg2, ____msg3, ____innermodFuncRet, __msg4, __modFuncRet, msg5] = entries

const modFuncCall = entries[1] as LogEntryCall
const __innermodFuncCall = entries[3] as LogEntryCall

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
    })
  })
})
