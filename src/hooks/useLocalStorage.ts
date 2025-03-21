import { useState, useEffect, Dispatch, SetStateAction } from 'react'

export const useLocalStorage = <T>(
    key: string,
    initialValue: T,
    ttl?: number
  ): [T, Dispatch<SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return initialValue

      const parsed = JSON.parse(item)
      if (ttl && Date.now() > parsed.expires) {
        localStorage.removeItem(key)
        return initialValue
      }

      return parsed.value
    } catch {
      return initialValue
    }
  })

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function 
        ? value(storedValue)
        : value

      const toStore = ttl 
        ? { value: valueToStore, expires: Date.now() + ttl }
        : { value: valueToStore }
      
      localStorage.setItem(key, JSON.stringify(toStore))
      setStoredValue(valueToStore)
    } catch (error) {
      console.error('LocalStorage error:', error)
    }
  }

  useEffect(() => {
    const syncState = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setStoredValue(parsed.value)
        } catch (error) {
          console.error('Sync localStorage error:', error)
        }
      }
    }

    window.addEventListener('storage', syncState)
    return () => window.removeEventListener('storage', syncState)
  }, [key])

  return [storedValue, setValue]
}