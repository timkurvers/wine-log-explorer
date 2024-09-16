import { describe, expect, it } from 'vitest'

import { enumRecordFor, enumValuesFor } from './types'

enum Currency {
  USD = 'US Dollar',
  EUR = 'Euro',
}

enum Ranking {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
}

describe('enumValuesFor', () => {
  it('returns an array of string enum values', () => {
    expect(enumValuesFor(Currency)).toEqual([Currency.USD, Currency.EUR])
  })

  it('returns an array of number enum values', () => {
    expect(enumValuesFor(Ranking)).toEqual([Ranking.FIRST, Ranking.SECOND, Ranking.THIRD])
  })
})

describe('enumRecordFor', () => {
  it('constructs an iterable string enum record', () => {
    const record = enumRecordFor(Currency, (value) => value.length)
    expect(record).toEqual({
      [Currency.USD]: 9,
      [Currency.EUR]: 4,
    })
    expect(Array.from(record)).toEqual([9, 4])
  })

  it('constructs an iterable number enum record', () => {
    const record = enumRecordFor(Ranking, (value) => value * 3)
    expect(record).toEqual({
      [Ranking.FIRST]: 3,
      [Ranking.SECOND]: 6,
      [Ranking.THIRD]: 9,
    })
    expect(Array.from(record)).toEqual([3, 6, 9])
  })
})
