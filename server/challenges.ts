import { transaction, type Database } from './database.ts'
import { administrationAudit } from './administration.ts'
import { HttpError, record, revisionOf } from './validation.ts'
import type { ChallengeBankItem, ChallengeDefinition, ChallengeHistory, ChallengeProgress, ChallengeResult, ChallengeSchedule, ChallengeSnapshot, DailyQuestion, StudentUser, Submission } from './contracts.ts'

export const challengeTimeZone='America/Mexico_City'
export function challengeDay(date=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:challengeTimeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date)
 return ['year','month','day'].map(key=>parts.find(part=>part.type===key)!.value).join('-')
}
const ordinal=(day:string)=>Date.parse(day+'T00:00:00Z')/86_400_000
function validDay(value:unknown):string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(ordinal(value))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw new HttpError(400,'Elige una fecha válida.')
 return value
}
function field(value:unknown,label:string,min:number,max:number) {
 if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||[...value].some(char=>(char.charCodeAt(0)<32&&![9,10,13].includes(char.charCodeAt(0)))||char.charCodeAt(0)===127))throw new HttpError(400,`Revisa ${label}: usa de ${min} a ${max} caracteres.`)
 return value.trim()
}
const lanes=['grammar','words','everyday'] as const
const kinds=['complete','choose','meaning','reply','order'] as const
export function validateChallenge(value:unknown,id:string):ChallengeDefinition {
 const data=record(value)
 if(Object.keys(data).some(key=>!['lane','topic','kind','instruction','question','options','correctIndex','explanation','example'].includes(key)))throw new HttpError(400,'La pregunta contiene datos no admitidos.')
 if(!lanes.includes(data.lane as typeof lanes[number])||!kinds.includes(data.kind as typeof kinds[number]))throw new HttpError(400,'Elige un área y un formato válidos.')
 if(!Array.isArray(data.options)||data.options.length<3||data.options.length>4)throw new HttpError(400,'Añade tres o cuatro opciones.')
 const options=data.options.map(option=>field(option,'cada opción',1,180))
 if(new Set(options.map(option=>option.toLocaleLowerCase('en'))).size!==options.length||!Number.isInteger(data.correctIndex)||Number(data.correctIndex)<0||Number(data.correctIndex)>=options.length)throw new HttpError(400,'Usa opciones diferentes y señala una respuesta correcta.')
 return {id,lane:data.lane as ChallengeDefinition['lane'],kind:data.kind as ChallengeDefinition['kind'],topic:field(data.topic,'el tema',3,90),instruction:field(data.instruction,'la instrucción',5,180),question:field(data.question,'la pregunta',5,400),options,correctIndex:Number(data.correctIndex),explanation:field(data.explanation,'la explicación',10,700),example:field(data.example,'el ejemplo',5,400)}
}
type Assignment={id:number;day:string;program:string;group_name:string;slot:number;bank_id:string;content_json:string;revision:number;state:'published'|'archived';source:'automatic'|'scheduled'}
type Attempt={id:number;student_id:number;assignment_id:number;day:string;slot:number;answer_index:number;correct:number;points:number;created_at:string;request_key:string;fingerprint:string}
type BankRow={id:string;content_json:string;revision:number;status:ChallengeBankItem['status'];source:ChallengeBankItem['source']}
const bankItem=(row:BankRow):ChallengeBankItem=>({...JSON.parse(row.content_json) as ChallengeDefinition,revision:row.revision,status:row.status,source:row.source})
function assignmentId(value:string) {
 if(!/^Q-\d+$/.test(value)||!Number.isSafeInteger(Number(value.slice(2))))throw new HttpError(404,'El reto ya no está disponible.')
 return Number(value.slice(2))
}
export function challengesRepository(db:Database,clock:()=>Date=()=>new Date()) {
 const today=()=>challengeDay(clock())
 const controls=()=>{const row=db.prepare('SELECT * FROM challenge_controls WHERE id=1').get()!;return {enabled:row.enabled===1,revision:Number(row.revision)}}
 const bank=()=>db.prepare('SELECT * FROM challenge_bank ORDER BY id').all().map(row=>bankItem(row as BankRow))
 const active=(user:StudentUser)=>{
  const id=Number(user.id.slice(4)),row=db.prepare("SELECT r.payload FROM requests r JOIN students s ON s.request_id=r.id WHERE r.id=? AND r.status='aprobada' AND s.status='activo'").get(id)
  if(!row)throw new HttpError(401,'Tu acceso no está disponible. Consulta con CAI.')
  return {id,profile:JSON.parse(String(row.payload)) as Submission}
 }
 const get=(id:number)=>{const row=db.prepare('SELECT * FROM daily_challenges WHERE id=?').get(id) as Assignment|undefined;if(!row)throw new HttpError(404,'El reto ya no está disponible.');return row}
 const result=(attempt:Attempt,row:Assignment):ChallengeResult=>{const question=JSON.parse(row.content_json) as ChallengeDefinition;return {answerIndex:attempt.answer_index,correct:attempt.correct===1,points:attempt.points,createdAt:attempt.created_at,correctIndex:question.correctIndex,explanation:question.explanation,example:question.example}}
 const publicQuestion=(row:Assignment,attempt:Attempt|null,previousGroup=false):DailyQuestion=>{
  const question=JSON.parse(row.content_json) as ChallengeDefinition
  return {id:'Q-'+row.id,revision:row.revision,day:row.day,slot:row.slot,topic:question.topic,kind:question.kind,instruction:question.instruction,question:question.question,options:question.options,attempt:attempt?result(attempt,row):null,previousGroup}
 }
 const automatic=(day:string,slot:number)=>{
  const pool=bank().filter(item=>item.status==='ready'&&item.lane===lanes[slot])
  // Día absoluto: mismo contenido por día/área en todos los grupos y tras reiniciar.
  return pool.length?pool[(ordinal(day)+slot*13)%pool.length]!:null
 }
 const ensure=(day:string,profile:Submission)=>{
  for(let slot=0;slot<3;slot++){
   if(db.prepare('SELECT id FROM daily_challenges WHERE day=? AND program=? AND group_name=? AND slot=?').get(day,profile.program,profile.group,slot))continue
   const item=automatic(day,slot);if(!item)continue
   const {revision:_,status:__,source:___,...question}=item;void _;void __;void ___
   db.prepare("INSERT INTO daily_challenges(day,program,group_name,slot,bank_id,content_json,state,source) VALUES (?,?,?,?,?,?,'published','automatic')").run(day,profile.program,profile.group,slot,item.id,JSON.stringify(question))
  }
 }
 const progress=(student:number,day:string):ChallengeProgress=>{
  const rows=db.prepare('SELECT day,COUNT(*) AS n,SUM(points) AS points,SUM(correct) AS correct FROM challenge_attempts WHERE student_id=? GROUP BY day ORDER BY day').all(student)
  const complete=rows.filter(row=>row.n===3).map(row=>String(row.day)),set=new Set(complete)
  let currentStreak=0,cursor=ordinal(day)-(set.has(day)?0:1),longestStreak=0,run=0,previous=-Infinity
  while(set.has(new Date(cursor*86_400_000).toISOString().slice(0,10))){currentStreak++;cursor--}
  for(const date of complete){const n=ordinal(date);run=n===previous+1?run+1:1;previous=n;longestStreak=Math.max(longestStreak,run)}
  return {points:rows.reduce((n,row)=>n+Number(row.points),0),answered:rows.reduce((n,row)=>n+Number(row.n),0),correct:rows.reduce((n,row)=>n+Number(row.correct),0),participatedDays:rows.length,completedDays:complete.length,currentStreak,longestStreak,todayAnswered:Number(rows.find(row=>row.day===day)?.n??0)}
 }
 const scheduleItem=(row:Assignment):ChallengeSchedule=>({id:'Q-'+row.id,day:row.day,slot:row.slot,program:row.program,group:row.group_name,revision:row.revision,state:row.state,question:JSON.parse(row.content_json) as ChallengeDefinition,source:row.source,attempts:Number(db.prepare('SELECT COUNT(*) AS n FROM challenge_attempts WHERE assignment_id=?').get(row.id)!.n)})
 const group=(id:number)=>{const row=db.prepare("SELECT * FROM course_groups WHERE id=? AND name!='Por asignar'").get(id);if(!row)throw new HttpError(404,'Elige un grupo con horario asignado.');return row}
 const calendar=(dayValue:unknown,groupId:number)=>{
  const day=validDay(dayValue),audience=group(groupId),rows=db.prepare('SELECT * FROM daily_challenges WHERE day=? AND program=? AND group_name=? ORDER BY slot').all(day,String(audience.program),String(audience.name)) as Assignment[]
  const items:ChallengeSchedule[]=[]
  for(let slot=0;slot<3;slot++){
   const row=rows.find(row=>row.slot===slot);if(row){items.push(scheduleItem(row));continue}
   const item=day>=today()?automatic(day,slot):null;if(!item)continue
   const {revision:_,status:__,source:___,...question}=item;void _;void __;void ___
   items.push({id:'auto-'+slot,day,slot,program:String(audience.program),group:String(audience.name),revision:0,state:'published',question,source:'automatic',attempts:0})
  }
  return {day,timeZone:challengeTimeZone,items,controls:controls(),today:today()}
 }
 return {
  bank,controls,calendar,
  snapshot(user:StudentUser):ChallengeSnapshot {
   return transaction(db,()=>{
    const {id,profile}=active(user),day=today(),needsGroup=profile.group==='Por asignar'
    if(!needsGroup&&controls().enabled)ensure(day,profile)
    const attempted=db.prepare('SELECT * FROM challenge_attempts WHERE student_id=? AND day=? ORDER BY slot').all(id,day) as Attempt[]
    const rows=needsGroup?[]:db.prepare("SELECT * FROM daily_challenges WHERE day=? AND program=? AND group_name=? AND state='published' ORDER BY slot").all(day,profile.program,profile.group) as Assignment[]
    const items:DailyQuestion[]=[]
    for(let slot=0;slot<3;slot++){
     const attempt=attempted.find(item=>item.slot===slot),row=attempt?get(attempt.assignment_id):rows.find(item=>item.slot===slot)
     if(row)items.push(publicQuestion(row,attempt??null,row.program!==profile.program||row.group_name!==profile.group))
    }
    return {day,timeZone:challengeTimeZone,enabled:controls().enabled,needsGroup,items,progress:progress(id,day)}
   })
  },
  answer(user:StudentUser,id:string,value:unknown,key:string):ChallengeResult {
   const data=record(value),revision=revisionOf(data.revision),qid=assignmentId(id)
   if(Object.keys(data).some(key=>!['revision','answerIndex'].includes(key))||!Number.isInteger(data.answerIndex)||Number(data.answerIndex)<0||Number(data.answerIndex)>3)throw new HttpError(400,'Elige una opción válida.')
   if(!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador de tu respuesta.')
   const fingerprint=JSON.stringify([qid,revision,data.answerIndex])
   return transaction(db,()=>{
    const {id:student,profile}=active(user),previous=db.prepare('SELECT * FROM challenge_attempts WHERE student_id=? AND request_key=?').get(student,key) as Attempt|undefined
    if(previous){if(previous.fingerprint!==fingerprint)throw new HttpError(409,'Este envío ya se recibió con otra respuesta. Actualiza tus retos.');return result(previous,get(previous.assignment_id))}
    const row=get(qid),question=JSON.parse(row.content_json) as ChallengeDefinition
    if(profile.group==='Por asignar'||row.program!==profile.program||row.group_name!==profile.group)throw new HttpError(404,'El reto ya no está disponible para tu grupo.')
    if(row.day!==today()||row.state!=='published'||row.revision!==revision||!controls().enabled)throw new HttpError(409,'El reto cambió, terminó o está pausado. Actualiza antes de responder.')
    if(Number(data.answerIndex)>=question.options.length)throw new HttpError(400,'Elige una opción válida.')
    if(db.prepare('SELECT id FROM challenge_attempts WHERE student_id=? AND day=? AND slot=?').get(student,row.day,row.slot))throw new HttpError(409,'Ya respondiste esta pregunta del día. Puedes revisar tu explicación.')
    const correct=data.answerIndex===question.correctIndex,points=correct?15:5
    const inserted=db.prepare('INSERT INTO challenge_attempts(student_id,assignment_id,day,slot,answer_index,correct,points,created_at,request_key,fingerprint) VALUES (?,?,?,?,?,?,?,?,?,?)').run(student,qid,row.day,row.slot,Number(data.answerIndex),Number(correct),points,clock().toISOString(),key,fingerprint)
    return result(db.prepare('SELECT * FROM challenge_attempts WHERE id=?').get(inserted.lastInsertRowid) as Attempt,row)
   })
  },
  history(user:StudentUser,before=0):ChallengeHistory {
   const {id}=active(user)
   const rows=db.prepare('SELECT * FROM challenge_attempts WHERE student_id=? AND (?=0 OR id<?) ORDER BY id DESC LIMIT 21').all(id,before,before) as Attempt[]
   return {items:rows.slice(0,20).map(row=>publicQuestion(get(row.assignment_id),row)),nextCursor:rows.length>20?rows[19]!.id:null}
  },
  configure(value:unknown,admin:number) {
   const data=record(value),revision=revisionOf(data.revision)
   if(Object.keys(data).some(key=>!['revision','enabled'].includes(key))||typeof data.enabled!=='boolean')throw new HttpError(400,'Revisa el estado de los retos.')
   transaction(db,()=>{if(controls().revision!==revision)throw new HttpError(409,'La configuración cambió. Actualiza antes de guardar.');db.prepare('UPDATE challenge_controls SET enabled=?,revision=revision+1 WHERE id=1').run(Number(data.enabled));administrationAudit(db,admin,'challenges.configured',{enabled:data.enabled})})
  },
  saveBank(id:string|null,value:unknown,admin:number,key:string) {
   const data=record(value),status=data.status
   if(typeof status!=='string'||!['draft','ready','archived'].includes(status)||Object.keys(data).some(key=>!['revision','status','question'].includes(key)))throw new HttpError(400,'Revisa el estado y los datos de la pregunta.')
   const revision=id?revisionOf(data.revision):0,newId=id??'custom-'+key
   if(!id&&!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador de la pregunta.')
   const question=validateChallenge(data.question,newId)
   return transaction(db,()=>{
    const previous=db.prepare('SELECT * FROM challenge_bank WHERE id=?').get(newId) as BankRow|undefined
    if(!id&&previous){if(previous.content_json!==JSON.stringify(question)||previous.status!==status)throw new HttpError(409,'Este envío ya se recibió con otros datos.');return bankItem(previous)}
    if(id&&(!previous||previous.revision!==revision))throw new HttpError(409,'La pregunta cambió. Actualiza antes de editarla.')
    db.prepare('INSERT INTO challenge_bank(id,content_json,status,source) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET content_json=excluded.content_json,status=excluded.status,revision=challenge_bank.revision+1').run(newId,JSON.stringify(question),String(status),previous?.source??'custom')
    administrationAudit(db,admin,'challenge.bank.saved',{id:newId,status,revision:revision+1})
    return bankItem(db.prepare('SELECT * FROM challenge_bank WHERE id=?').get(newId) as BankRow)
   })
  },
  schedule(value:unknown,admin:number) {
   const data=record(value),day=validDay(data.day)
   if(Object.keys(data).some(key=>!['day','groupId','slot','bankId','revision','state'].includes(key))||!Number.isInteger(data.groupId)||!Number.isInteger(data.slot)||Number(data.slot)<0||Number(data.slot)>2||typeof data.state!=='string'||!['published','archived'].includes(data.state)||typeof data.bankId!=='string'||!Number.isInteger(data.revision)||Number(data.revision)<0)throw new HttpError(400,'Revisa la fecha, el grupo y la pregunta.')
   if(day<today()||ordinal(day)>ordinal(today())+90)throw new HttpError(400,'Programa desde hoy y hasta los próximos 90 días.')
   return transaction(db,()=>{
    const audience=group(Number(data.groupId)),row=db.prepare('SELECT * FROM daily_challenges WHERE day=? AND program=? AND group_name=? AND slot=?').get(day,String(audience.program),String(audience.name),Number(data.slot)) as Assignment|undefined
    if((row?.revision??0)!==data.revision)throw new HttpError(409,'El calendario cambió. Actualiza antes de guardar.')
    const item=db.prepare('SELECT * FROM challenge_bank WHERE id=?').get(String(data.bankId)) as BankRow|undefined
    if(!item)throw new HttpError(400,'Elige una pregunta del banco.')
    const definition=JSON.parse(item.content_json) as ChallengeDefinition
    if(definition.lane!==lanes[Number(data.slot)])throw new HttpError(400,'La pregunta debe corresponder al área de este espacio.')
    const replacing=!row||row.bank_id!==item.id
    if(replacing&&(audience.active!==1||item.status!=='ready'))throw new HttpError(409,'Para programar, el grupo y la pregunta deben estar disponibles.')
    if(row&&replacing&&Number(db.prepare('SELECT COUNT(*) AS n FROM challenge_attempts WHERE assignment_id=?').get(row.id)!.n)>0)throw new HttpError(409,'Ya hay respuestas. Conserva esta pregunta y programa el cambio para otro día.')
    // Cambiar el banco no reescribe una pregunta que ya apareció en el calendario.
    const content=row&&!replacing?row.content_json:JSON.stringify(definition)
    db.prepare("INSERT INTO daily_challenges(day,program,group_name,slot,bank_id,content_json,state,source) VALUES (?,?,?,?,?,?,?,'scheduled') ON CONFLICT(day,program,group_name,slot) DO UPDATE SET bank_id=excluded.bank_id,content_json=excluded.content_json,state=excluded.state,source='scheduled',revision=daily_challenges.revision+1").run(day,String(audience.program),String(audience.name),Number(data.slot),item.id,content,String(data.state))
    administrationAudit(db,admin,'challenge.scheduled',{day,groupId:data.groupId,slot:data.slot,bankId:item.id,state:data.state})
    return calendar(day,Number(data.groupId))
   })
  },
 }
}
