/** Server-owned classification; clients cannot choose a notice priority. */
export const importantNoticeKinds = ['announcement','publication-review','learning-review','account','security','recovery'] as const
export const importantNoticeSubjects = ['Revisión de tu publicación','Revisión de tu solicitud','Revisión de tu comentario','Revisión de tu solicitud de insignia','Actualización de una insignia','Tu logro tiene novedades','Contraseña cambiada','Cambio de grupo','Corrección de inscripción'] as const
export function isImportantNotice(kind:string,subject:string) {
  return importantNoticeKinds.some(value=>value===kind)||importantNoticeSubjects.some(value=>value===subject)
}
