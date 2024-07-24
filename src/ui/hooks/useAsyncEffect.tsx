/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react'
import useOriginalAsyncEffect from 'use-async-effect'

type EffectCallback = (isMounted?: () => boolean) => unknown | Promise<unknown>

// Error-boundary compatible variant of useAsyncEffect
const useAsyncEffect = (operation: EffectCallback, ...rest: any[]) => {
  const [error, setError] = useState<any>(null)
  if (error) {
    throw error
  }

  const safeOperation = async () => {
    try {
      await operation()
    } catch (e) {
      setError(e)
    }
  }

  return useOriginalAsyncEffect(safeOperation, ...rest)
}

export default useAsyncEffect
