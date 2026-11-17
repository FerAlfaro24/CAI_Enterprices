import { useRef, useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import type { Attempt, Challenge } from '../types'

/** Shared by the original compact quiz and the redesigned Retos panel. */
export function useChallengeAnswer(challenge: Challenge, attempt: Attempt | undefined) {
  const { dispatch,connection } = useCommunity()
  const [pending,setPending]=useState(false)
  const sending=useRef(false),request=useRef<{index:number;key:string}|null>(null)
  const [selection, setSelection] = useState<number | null>(null)
  const [error, setError] = useState('')
  const selected = attempt?.answerIndex ?? selection
  const choose = (index: number) => { if(!sending.current){setSelection(index); setError('')} }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (attempt||sending.current) return
    if (selected === null) {
      setError('Elige una opción para participar en el reto.')
      event.currentTarget.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
      return
    }
    if(connection){
      if(!connection.challenges.enabled||connection.challenges.needsGroup)return
      if(request.current?.index!==selected)request.current={index:selected,key:crypto.randomUUID()}
      sending.current=true;setPending(true);setError('')
      try{if(!await connection.answerChallenge({id:challenge.id,revision:challenge.revision!},selected,request.current.key))setError('No pudimos confirmar tu respuesta. Revisa el aviso y vuelve a intentarlo o actualiza tus retos.')}
      finally{sending.current=false;setPending(false)}
      return
    }
    dispatch({ type: 'answer', challengeId: challenge.id, answerIndex: selected })
    setError('')
  }
  return { selected, error, choose, submit,pending,unavailable:Boolean(connection&&(!connection.challenges.enabled||connection.challenges.needsGroup)) }
}
