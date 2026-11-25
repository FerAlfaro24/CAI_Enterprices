import { useEffect, useState } from 'react'
import { ApiError, googleApi } from './api'
import { GoogleSignInButton } from './GoogleSignInButton'
import s from './google.module.css'

export function GoogleAccountLink({onAccessLost}:{onAccessLost:(error:unknown)=>void}) {
  const [account,setAccount]=useState<{enabled:boolean;linked:boolean}|null>(null),[error,setError]=useState('')
  useEffect(()=>{
    let active=true
    void googleApi.account().then(result=>{if(active)setAccount(result)}).catch((error:unknown)=>{if(active){setError(error instanceof Error?error.message:'No pudimos consultar Google.');if(error instanceof ApiError&&error.status===401)onAccessLost(error)}})
    return()=>{active=false}
  },[onAccessLost])
  if(!account?.enabled&&!error)return null
  return <section className={s.option} aria-label="Google en mi cuenta"><h3>Entrar con Google</h3>
    {error?<p role="alert">{error}</p>:account?.linked?<p>Tu cuenta de Google está vinculada. Puedes usarla para entrar a CAI.</p>:<><p>Ya tienes una cuenta en CAI. Vincula Google desde aquí para conservar tus logros y publicaciones.</p><GoogleSignInButton linkAccount/></>}
  </section>
}
