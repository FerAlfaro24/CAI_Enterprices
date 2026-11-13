import type { BadgeSpec } from '../server/contracts.ts'

/** Catálogo real; arte e identificadores preservados de v1.0. No contiene datos de alumnos. */
export const badgeDefinitions:readonly BadgeSpec[]=[
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
