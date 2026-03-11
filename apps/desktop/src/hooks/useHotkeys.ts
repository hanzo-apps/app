import { useEffect, useRef } from 'react'

export function useHotkeys(
  key: string,
  callback: () => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        event.preventDefault()
        callbackRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, ...deps])
}