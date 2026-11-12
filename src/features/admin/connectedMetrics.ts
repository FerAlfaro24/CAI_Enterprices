import type { LocalRequest, LocalStudent, ReviewPost } from '../../../server/contracts.ts'

/** Fechas UTC consistentes con los timestamps ISO del servidor; nunca añade series de muestra. */
export function connectedMetrics(requests: LocalRequest[],students:LocalStudent[],posts:ReviewPost[],now=new Date()) {
  const day=86400000,week=7*day
  const monday=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())-((now.getUTCDay()+6)%7)*day
  const starts=Array.from({length:8},(_,i)=>monday-(7-i)*week)
  const series=(dates:string[])=>starts.map(start=>dates.filter(value=>{const at=Date.parse(value);return at>=start&&at<start+week}).length)
  const submitted=series(posts.map(p=>p.createdAt)),approved=series(posts.flatMap(p=>p.status==='publicada'&&p.publishedAt?[p.publishedAt]:[]))
  return {labels:starts.map(at=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',timeZone:'UTC'}).format(at)),submitted,approved,
    pending:series(requests.filter(r=>r.status==='pendiente').map(r=>r.submittedAt)),students:series(students.map(s=>s.joinedAt)),requests:series(requests.filter(r=>r.status==='aprobada').map(r=>r.submittedAt)),max:Math.max(4,Math.ceil(Math.max(0,...submitted,...approved)/4)*4)}
}
