import { useEffect, useState } from 'react'
import { renewalLabel } from '../../../../shared/challenge-practice'

/** El plazo parte del servidor; el transcurso se mide sin usar el reloj de pared del dispositivo. */
export function useDailyRenewal(serverTime?:string,nextRefreshAt?:string) {
  const source=`${serverTime??''}|${nextRefreshAt??''}`
  const duration=Date.parse(nextRefreshAt??'')-Date.parse(serverTime??'')
  const [sample,setSample]=useState({source,elapsed:0})
  useEffect(()=>{
    if(!Number.isFinite(duration))return
    const received=performance.now()
    const update=()=>setSample({source,elapsed:performance.now()-received})
    const timer=window.setInterval(update,30000)
    const boundary=window.setTimeout(update,Math.max(0,duration))
    return()=>{clearInterval(timer);clearTimeout(boundary)}
  },[source,duration])
  const remaining=duration-(sample.source===source?sample.elapsed:0)
  return {label:renewalLabel(remaining),expired:Number.isFinite(remaining)&&remaining<=0}
}
