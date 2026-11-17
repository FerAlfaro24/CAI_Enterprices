import { useCallback,useEffect,useId,useRef,useState } from 'react'
import { challengesApi,ApiError,type CatalogGroup,type ChallengeBankItem,type ChallengeCalendar,type ChallengeSchedule } from '../features/local-access/api'
import { useAdmin } from '../features/admin/state'
import { ChallengeEditor } from '../features/admin/components/ChallengeEditor'
import s from '../features/admin/admin.module.css'
import c from '../features/admin/challenges.module.css'

const areas={grammar:'Gramática',words:'Vocabulario',everyday:'Vida diaria'}
const states={draft:'Borrador',ready:'Lista',archived:'Archivada'}
const localDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
function CalendarCard({item,bank,busy,onSave,canEdit}:{item:ChallengeSchedule;bank:ChallengeBankItem[];busy:boolean;onSave:(bankId:string,state:'published'|'archived')=>void;canEdit:boolean}){
 const id=useId(),[selected,setSelected]=useState(item.question.id)
 const ready=bank.filter(q=>q.status==='ready'&&q.lane===item.question.lane)
 const preview=selected===item.question.id?item.question:ready.find(q=>q.id===selected)
 return <article aria-label={`Pregunta ${item.slot+1}: ${areas[item.question.lane]}`}><span className={s.eyebrow}>{item.slot+1} · {areas[item.question.lane]}</span><h3>{item.question.topic}</h3><p>{item.question.question}</p><p className={s.footnote}>{item.state==='archived'?'Pausada para este grupo':item.source==='automatic'?'Rotación automática':'Programada por coordinación'} · {item.attempts} respuestas recibidas</p>
 {canEdit&&<><div className={c.field}><label htmlFor={id}>Pregunta para este espacio</label><select id={id} value={selected} disabled={busy||item.attempts>0} onChange={e=>setSelected(e.target.value)}>{!ready.some(q=>q.id===item.question.id)&&<option value={item.question.id}>{item.question.topic} · Guardada en el calendario</option>}{ready.map(q=><option key={q.id} value={q.id}>{q.topic} · {q.question}</option>)}</select></div><div className={s['head-actions']}><button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={busy||selected===item.question.id||item.attempts>0} onClick={()=>onSave(selected,'published')}>Usar esta pregunta</button><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>onSave(item.question.id,item.state==='published'?'archived':'published')}>{item.state==='published'?'Pausar pregunta':'Reactivar pregunta'}</button></div>{item.attempts>0&&<p className={s.footnote}>Ya hay respuestas: puedes pausarla, pero cambiar el contenido requiere programar otro día.</p>}</>}
 <details className={c.preview}><summary>Revisar pregunta y explicación</summary><p>{preview?.instruction}</p><p><b>{preview?.question}</b></p><ol type="A">{preview?.options.map((option,index)=><li key={index}>{option}{index===preview.correctIndex?' ✓ Correcta':''}</li>)}</ol><p>{preview?.explanation}</p><p>{preview?.example}</p></details></article>
}
function ChallengeCalendarPanel({bank,groups,handleFailure}:{bank:ChallengeBankItem[];groups:CatalogGroup[];handleFailure:(error:unknown)=>void}){
 const [day,setDay]=useState(localDay),[groupId,setGroupId]=useState(()=>groups.find(g=>g.active&&g.name!=='Por asignar')?.id??0)
 const [calendar,setCalendar]=useState<ChallengeCalendar|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const generation=useRef(0),writing=useRef(false),id=useId()
 const refresh=useCallback(()=>{
  const version=++generation.current
  if(!groupId)return Promise.resolve()
  return challengesApi.calendar(day,groupId).then(data=>{if(version===generation.current){setCalendar(data);setError('')}}).catch((error:unknown)=>{if(version===generation.current){handleFailure(error);setError(error instanceof Error?error.message:'No pudimos cargar el calendario.')}}).finally(()=>{if(version===generation.current)setLoading(false)})
 },[day,groupId,handleFailure])
 useEffect(()=>{const sequence=generation;void refresh();return()=>{sequence.current++}},[refresh])
 const save=async(item:ChallengeSchedule,bankId:string,state:'published'|'archived')=>{
  if(writing.current)return
  writing.current=true;generation.current++;setBusy(true);setError('');setNotice('')
  try{const data=await challengesApi.schedule(item,groupId,bankId,state);setCalendar(data);setNotice(state==='archived'?'Pregunta pausada para este grupo.':'Calendario guardado para este grupo.')}
  catch(error){handleFailure(error);if(error instanceof ApiError&&error.status===409)await refresh();setError(error instanceof Error?error.message:'No pudimos guardar el calendario.')}
  finally{writing.current=false;setBusy(false)}
 }
 const visible=calendar?.day===day?calendar:null
 return <section className={s.card} aria-label="Calendario de retos"><div className={c.toolbar}><h2>Calendario por grupo</h2><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>{setLoading(true);void refresh()}}>Actualizar calendario</button></div><p className={s.footnote}>Cada día se preparan tres preguntas automáticamente. No necesitas cargarlas a diario. Aquí puedes escoger otras para un grupo, desde hoy y hasta 90 días después. Hora de Ciudad de México.</p><div className={c.two}><div className={c.field}><label htmlFor={id+'-date'}>Fecha del reto</label><input id={id+'-date'} type="date" value={day} disabled={busy} onChange={e=>{if(e.target.value!==day){setDay(e.target.value);setLoading(true);setCalendar(null);setNotice('')}}}/></div><div className={c.field}><label htmlFor={id+'-group'}>Grupo de los retos</label><select id={id+'-group'} value={groupId} disabled={busy} onChange={e=>{if(Number(e.target.value)!==groupId){setGroupId(Number(e.target.value));setCalendar(null);setLoading(true);setNotice('')}}}>{groups.filter(g=>g.name!=='Por asignar').map(g=><option key={g.id} value={g.id}>{g.program} · {g.name}{g.active?'':' · Archivado'}</option>)}</select></div></div>
 {error&&<p role="alert" className={s.alert}>{error}</p>}{notice&&<p role="status" className={c.notice}>{notice}</p>}
 {!groupId?<p>No hay grupos con horario para programar. Puedes crearlos en Configuración.</p>:loading?<p role="status">Cargando calendario…</p>:visible&&<div className={c.calendar}>{visible.items.map(item=><CalendarCard key={groupId+'-'+item.day+'-'+item.slot+'-'+item.revision} item={item} bank={bank} busy={busy} canEdit={day>=visible.today} onSave={(bankId,state)=>{void save(item,bankId,state)}}/>)}{visible.items.length<3&&<p>No hay una pregunta disponible para cada área. Revisa que haya preguntas listas en el banco. Los días pasados muestran solo retos que se sirvieron a este grupo.</p>}</div>}
 </section>
}
export function AdminChallengesPage(){
 const {connection}=useAdmin(),accessLost=connection?.refresh
 const [bank,setBank]=useState<ChallengeBankItem[]>([]),[controls,setControls]=useState<{enabled:boolean;revision:number}|null>(null),[tab,setTab]=useState<'calendar'|'bank'>('calendar')
 const [editor,setEditor]=useState<ChallengeBankItem|null|undefined>(),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [search,setSearch]=useState(''),[area,setArea]=useState('all'),[status,setStatus]=useState('all'),[page,setPage]=useState(0)
 const generation=useRef(0),writing=useRef(false),id=useId()
 const failure=useCallback((error:unknown)=>{if(error instanceof ApiError&&error.status===401){setBank([]);setControls(null);setEditor(undefined);void accessLost?.()}},[accessLost])
 const refresh=useCallback(()=>{const version=++generation.current;return Promise.all([challengesApi.bank(),challengesApi.controls()]).then(([data,controls])=>{if(version===generation.current){setBank(data.items);setControls(controls);setError('')}}).catch((error:unknown)=>{if(version===generation.current){failure(error);setError(error instanceof Error?error.message:'No pudimos cargar los retos.')}}).finally(()=>{if(version===generation.current)setLoading(false)})},[failure])
 useEffect(()=>{const sequence=generation;void refresh();return()=>{sequence.current++}},[refresh])
 const write=async(operation:()=>Promise<unknown>,message:string)=>{
  if(writing.current)return false
  writing.current=true;generation.current++;setBusy(true);setError('');setNotice('')
  try{await operation();await refresh();setNotice(message);return true}
  catch(error){failure(error);if(error instanceof ApiError&&error.status===409)await refresh();setError(error instanceof Error?error.message:'No pudimos guardar.');return false}
  finally{writing.current=false;setBusy(false)}
 }
 const filtered=bank.filter(q=>(area==='all'||q.lane===area)&&(status==='all'||q.status===status)&&(q.topic+' '+q.question).toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))),maxPage=Math.max(0,Math.ceil(filtered.length/12)-1),currentPage=Math.min(page,maxPage)
 return <><div className={s['page-head']}><div><p className={s.eyebrow}>Aprendizaje diario</p><h1 className={s['page-title']}>Retos de inglés</h1><p className={s['page-lead']}>Tres preguntas al día, con explicación y ejemplo. El calendario funciona automáticamente; tú revisas y ajustas cuando haga falta.</p></div><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>{void refresh()}}>Actualizar retos</button></div>
 {error&&<p role="alert" className={s.alert}>{error}</p>}{notice&&<p role="status" className={c.notice}>{notice}</p>}
 {loading?<p role="status">Cargando retos…</p>:<><section className={`${s.card} ${c.toolbar}`} aria-label="Estado de los retos"><div><h2>{controls?.enabled?'Retos activos':'Retos pausados'}</h2><p className={s.footnote}>{bank.filter(q=>q.status==='ready').length} preguntas listas · {new Set(bank.map(q=>q.topic)).size} temas. Pausar conserva los resultados y permite repasar.</p></div>{controls&&<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>{void write(()=>challengesApi.configure({...controls,enabled:!controls.enabled}),controls.enabled?'Retos pausados.':'Retos activados.')}}>{controls.enabled?'Pausar todos los retos':'Activar los retos'}</button>}</section>
 <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Gestión de retos"><button className={s.tab} type="button" aria-pressed={tab==='calendar'} onClick={()=>{setTab('calendar');setEditor(undefined)}}>Calendario</button><button className={s.tab} type="button" aria-pressed={tab==='bank'} onClick={()=>setTab('bank')}>Banco de preguntas</button></div></div>
 {tab==='calendar'?<ChallengeCalendarPanel bank={bank} groups={connection?.configuration?.groups??[]} handleFailure={failure}/>:<><section className={s.card}><div className={c.toolbar}><h2>Banco de preguntas</h2><button className={`${s.btn} ${s['btn--primary']}`} type="button" disabled={busy||editor!==undefined} onClick={()=>setEditor(null)}>Crear pregunta</button></div><p className={s.footnote}>Las preguntas listas rotan por área; los borradores y las archivadas no entran en nuevos retos automáticos.</p><div className={c.filters}><div className={c.field}><label htmlFor={id+'-search'}>Buscar tema o pregunta</label><input id={id+'-search'} type="search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}/></div><div className={c.field}><label htmlFor={id+'-area'}>Filtrar por área</label><select id={id+'-area'} value={area} onChange={e=>{setArea(e.target.value);setPage(0)}}><option value="all">Todas las áreas</option>{Object.entries(areas).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></div><div className={c.field}><label htmlFor={id+'-status'}>Filtrar por disponibilidad</label><select id={id+'-status'} value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="all">Todas</option>{Object.entries(states).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></div></div><p>{filtered.length} preguntas encontradas</p>
 <ul className={c.catalog} aria-label="Preguntas del banco">{filtered.slice(currentPage*12,currentPage*12+12).map(q=><li key={q.id}><small>{areas[q.lane]} · {states[q.status]}</small><h3>{q.topic}</h3><p>{q.question}</p><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy||editor!==undefined} aria-label={'Editar pregunta '+q.id} onClick={()=>setEditor(q)}>Revisar o editar</button></li>)}</ul><div className={c.toolbar}><button className={`${s.btn} ${s['btn--ghost']}`} type="button" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Página anterior</button><span>Página {currentPage+1} de {maxPage+1}</span><button className={`${s.btn} ${s['btn--ghost']}`} type="button" disabled={currentPage>=maxPage} onClick={()=>setPage(currentPage+1)}>Página siguiente</button></div></section>
 {editor!==undefined&&<ChallengeEditor key={editor?.id??'new'} item={editor} onCancel={()=>setEditor(undefined)} onSave={async(question,status,key)=>{const saved=await write(()=>challengesApi.saveBank(editor,question,status,key),'Pregunta guardada. Los retos del calendario conservan su contenido.');if(saved)setEditor(undefined);return saved}}/>}</>}
 </>}
 </>
}
