import type { BadgeSpec } from '../server/contracts.ts'

/** Catálogo real; arte e identificadores preservados de v1.0. No contiene datos de alumnos. */
export const legacyBadgeDefinitions:readonly BadgeSpec[]=[
 {id:'first-answer',title:'Primera respuesta',description:'Comprueba una respuesta de Retos, aciertes o no.',symbol:'🎯',tone:'blue',category:'retos',mode:'automatic',availability:'active'},
 {id:'three-consecutive',title:'3 días seguidos',description:'Completa las tres preguntas diarias durante tres días consecutivos. No necesitas acertar todas.',symbol:'🔥',tone:'yellow',category:'retos',mode:'automatic',availability:'active'},
 {id:'five-days',title:'En comunidad',description:'Completa las tres preguntas en cinco días de práctica; pueden ser días separados.',symbol:'💙',tone:'purple',category:'retos',mode:'automatic',availability:'active'},
 {id:'movie-explorer',title:'Explorador de películas',description:'Una película en inglés, nuevas frases y una historia que contar.',symbol:'🎬',tone:'peach',category:'aventuras',mode:'review',availability:'active'},
 {id:'music-catcher',title:'Music Catcher',description:'Descubre expresiones nuevas en una canción en inglés.',symbol:'🎵',tone:'purple',category:'aventuras',mode:'review',availability:'active'},
 {id:'book-buddy',title:'Book Buddy',description:'Lee una historia en inglés y cuéntanos qué descubriste.',symbol:'📚',tone:'mint',category:'aventuras',mode:'review',availability:'active'},
 {id:'speaking-confidence',title:'Sin miedo al inglés',description:'CAI reconoce el valor de conversar aunque haya nervios.',symbol:'💬',tone:'mint',category:'comunidad',mode:'review',availability:'institutional'},
 {id:'good-companion',title:'Buen compañero',description:'Por animar y acompañar a otras personas.',symbol:'💙',tone:'blue',category:'comunidad',mode:'review',availability:'institutional'},
 {id:'cai-consistency',title:'Constancia',description:'CAI celebra el esfuerzo de volver a intentarlo. Es distinta de la serie automática de Retos.',symbol:'🌟',tone:'yellow',category:'comunidad',mode:'review',availability:'institutional'},
]


export const learningBadgeRules = [
  ...(['reading','screen','music'] as const).flatMap((metric,index)=>[3,10,25].map((target,level)=>({
    id:[['book-buddy','book-silver','book-gold'],['movie-explorer','screen-silver','screen-gold'],['music-catcher','music-silver','music-gold']][index]![level]!,
    metric,target,title:[['Book Buddy','Lectura de plata','Biblioteca de oro'],['Explorador de películas','Cine de plata','Cine de oro'],['Music Catcher','Música de plata','Música de oro']][index]![level]!,
    symbol:['📚','🎬','🎵'][index]!,description:`Completa ${target} logros distintos de ${['lectura','cine o series','música'][index]} validados por CAI. Puedes conservarlos privados.`,
  }))),
  ...[7,30,90].map((target,index)=>({id:`practice-${target}`,metric:'days' as const,target,title:['Una semana aprendiendo','Un mes de práctica','Constancia de oro'][index]!,symbol:'🔥',description:`Completa las tres preguntas de Retos en ${target} días. Los días no tienen que ser consecutivos.`})),
  ...[5,20,50].map((target,index)=>({id:`stories-${target}`,metric:'posts' as const,target,title:['Voz de la comunidad','Voz que inspira','Huella en CAI'][index]!,symbol:'💬',description:`Comparte ${target} publicaciones originales aprobadas. Los duplicados no cuentan.`})),
]
export const badgeDefinitions:readonly BadgeSpec[]=[
  ...legacyBadgeDefinitions.map(badge=>{const rule=learningBadgeRules.find(rule=>rule.id===badge.id);return rule?{...badge,mode:'automatic' as const,description:rule.description}:badge}),
  ...learningBadgeRules.filter(rule=>!legacyBadgeDefinitions.some(badge=>badge.id===rule.id)).map(rule=>({id:rule.id,title:rule.title,description:rule.description,symbol:rule.symbol,tone:'yellow' as const,category:rule.metric==='days'?'retos' as const:rule.metric==='posts'?'comunidad' as const:'aventuras' as const,mode:'automatic' as const,availability:'active' as const})),
]
