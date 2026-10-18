import { useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import type { Attempt, Challenge } from '../types'

/** Shared by the original compact quiz and the redesigned Retos panel. */
export function useChallengeAnswer(challenge: Challenge, attempt: Attempt | undefined) {
  const { dispatch } = useCommunity()
  const [selection, setSelection] = useState<number | null>(null)
  const [error, setError] = useState('')
  const selected = attempt?.answerIndex ?? selection
  const choose = (index: number) => { setSelection(index); setError('') }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (attempt) return
    if (selected === null) {
      setError('Elige una opción para participar en el reto.')
      event.currentTarget.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
      return
    }
    dispatch({ type: 'answer', challengeId: challenge.id, answerIndex: selected })
    setError('')
  }
  return { selected, error, choose, submit }
}
