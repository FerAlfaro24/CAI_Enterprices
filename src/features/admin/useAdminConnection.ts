import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, localApi, type ActivationInvitation, type LocalRequest, type LocalStudent, type LocalUser, type ReviewPost, type PublicationDecision, type CatalogGroup, type CommunityControls } from '../local-access/api'
import { defaultSettings, type AdminAction, type AdminState } from './state'

export function useAdminConnection() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [checking, setChecking] = useState(true), [loaded, setLoaded] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [requests, setRequests] = useState<LocalRequest[]>([]), [students, setStudents] = useState<LocalStudent[]>([]), [posts, setPosts] = useState<ReviewPost[]>([])
  const [configuration, setConfiguration] = useState<{groups: CatalogGroup[];settings:CommunityControls} | null>(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  const [invitation, setInvitation] = useState<(ActivationInvitation & {name:string}) | null>(null)
  const generation = useRef(0), writing = useRef(false)
  const failure = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) { generation.current++; setUser(null); setLoaded(false); setRequests([]); setStudents([]); setPosts([]); setInvitation(null); setConfiguration(null) }
    setError(error instanceof Error ? error.message : 'No pudimos completar la operación.')
  }, [])
  const refresh = useCallback(() => {
    const current = ++generation.current
    return Promise.all([localApi.requests(),localApi.students(),localApi.posts(),localApi.configuration()]).then(([r,s,p,c])=>{
      if (current !== generation.current) return
      setRequests(r.requests);setStudents(s.students);setPosts(p.posts);setConfiguration(c);setLoaded(true);setError('')
    }).catch((error:unknown)=>{if(current===generation.current)failure(error)})
  }, [failure])
  useEffect(() => {
    let active=true
    const sequence=generation
    void localApi.session().then(({user})=>{if(active)setUser(user)}).catch((error:unknown)=>{if(active){setSessionError(error instanceof Error?error.message:'No pudimos comprobar tu acceso.');failure(error)}}).finally(()=>{if(active)setChecking(false)})
    return ()=>{active=false;sequence.current++}
  }, [failure])
  useEffect(()=>{if(user)void refresh()},[user,refresh])
  const mutate = async (action: AdminAction, reference?: string) => {
    if(writing.current)return false
    writing.current=true;setBusy(true);setError('');setNotice('')
    try {
      if(action.type==='reset') {await refresh();return true}
      if(action.type==='decide'||action.type==='undo'||action.type==='consent') {
        const request=requests.find(r=>r.id===action.id)
        if(!request)throw new Error('Actualiza la solicitud antes de decidir.')
        await localApi.decide(request,action.type==='undo'?'undo':action.type==='consent'?'consent':action.status==='aprobada'?'approve':'reject',reference)
      } else if(action.type==='suspend'||action.type==='reactivate') {
        const student=students.find(s=>s.id===action.id)
        if(!student)throw new Error('Actualiza la ficha antes de cambiar el acceso.')
        await localApi.studentStatus(student,action.type==='suspend'?'suspendido':'activo')
      } else throw new Error('Esta función todavía no está conectada. No se guardaron cambios.')
      setNotice('Cambio guardado en el servidor local.');await refresh();return true
    } catch(error) {failure(error);if(error instanceof ApiError&&error.status===409){await refresh();setError(error.message)}return false}
    finally {writing.current=false;setBusy(false)}
  }
  const moderate=async(id:string,decision:PublicationDecision,reason?:string,confirmed?:boolean)=>{
    if(writing.current)return false
    const post=posts.find(p=>p.id===id)
    if(!post){setError('Actualiza la publicación antes de decidir.');return false}
    writing.current=true;setBusy(true);setError('');setNotice('')
    try {await localApi.moderate(post,decision,reason,confirmed);setNotice('Revisión guardada. Community mostrará el cambio al actualizarse.');await refresh();return true}
    catch(error){failure(error);if(error instanceof ApiError&&error.status===409){await refresh();setError(error.message)}return false}
    finally{writing.current=false;setBusy(false)}
  }
  const configure=async(operation:()=>Promise<unknown>,message:string)=>{
    if(writing.current)return false
    writing.current=true;setBusy(true);setError('');setNotice('')
    try{await operation();setNotice(message);await refresh();return true}
    catch(error){failure(error);if(error instanceof ApiError&&error.status===409){await refresh();setError(error.message)}return false}
    finally{writing.current=false;setBusy(false)}
  }
  const saveControls=(settings:CommunityControls)=>configure(()=>localApi.saveControls(settings),'Configuración guardada.')
  const createGroup=(program:string,name:string)=>configure(()=>localApi.createGroup(program,name),'Grupo creado. Ya está disponible en el registro y en las fichas.')
  const toggleGroup=(group:CatalogGroup)=>configure(()=>localApi.groupStatus(group,!group.active),group.active?'Grupo archivado para nuevas selecciones. Sus alumnos conservan el acceso.':'Grupo reactivado.')
  const assign=(id:string,program:string,group:string,confirmed:boolean)=>{
    const student=students.find(student=>student.id===id)
    if(!student)return Promise.resolve(false)
    return configure(()=>localApi.assignStudent(student,program,group,confirmed),'Asignación guardada. El alumno debe volver a entrar; sus historias conservan el grupo de origen.')
  }
  const invite=async(id:string)=>{
    const student=students.find(s=>s.id===id)
    if(!student||writing.current)return
    writing.current=true;setBusy(true);setError('')
    try {setInvitation({...await localApi.invite(student),name:student.name});await refresh()}catch(error){failure(error)}finally{writing.current=false;setBusy(false)}
  }
  const logout=async()=>{
    if(writing.current)return
    setBusy(true)
    try {await localApi.logout();generation.current++;setUser(null);setLoaded(false);setRequests([]);setStudents([]);setPosts([]);setInvitation(null);setError('') }catch(error){failure(error)}finally{setBusy(false)}
  }
  const directory=students.map(s=>({...s,posts:posts.filter(p=>p.studentId===s.id&&p.status==='publicada').length,isNew:s.joinedAt.startsWith(new Date().toISOString().slice(0,7))}))
  const state:AdminState={requests,posts:posts.map(p=>({id:p.id,author:p.studentName,authorIsMinor:p.authorIsMinor,program:p.program,type:p.category==='achievement'?'logro':'experiencia',title:p.title,body:p.body,submittedAt:p.createdAt.slice(0,10),status:p.status,rejectReason:p.reason??undefined})),suspended:students.filter(s=>s.status==='suspendido').map(s=>s.id),settings:{...defaultSettings,allowPhotos:false,allowReactions:false,allowComments:false},directory}
  return {user,checking,sessionError,loaded,configuration,saveControls,createGroup,toggleGroup,assign,state,requests,students,posts,error,busy,notice,invitation,setInvitation,mutate,moderate,invite,refresh,logout,onLogin:(user:LocalUser)=>{setError('');setSessionError('');setUser(user)}}
}
export type AdminConnection=ReturnType<typeof useAdminConnection>
