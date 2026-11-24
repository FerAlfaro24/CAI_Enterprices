/** Datos públicos necesarios para elegir avisos; independiente de React y del servidor. */
export type HighlightPost = {
  id:string; status:string; authorId:string; category:string; title:string; body:string;
  createdAt:string; expiresAt?:string|null; photos:readonly {src:string;alt:string}[];
}
export type CommunityHighlight = {
  id:string; kind:'notice'; title:string; description:string; photo?:{src:string;alt:string};
  postId:string; label:string; action:string;
}

/** Solo avisos institucionales vigentes; no usa álbumes ni mensajes privados. */
export function communityHighlights(posts:readonly HighlightPost[],now=Date.now()):CommunityHighlight[] {
  return posts.filter(post=>post.status==='approved'&&post.authorId==='cai-team'&&post.category==='announcement'&&(!post.expiresAt||Date.parse(post.expiresAt)>now))
    .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id.localeCompare(a.id,undefined,{numeric:true}))
    .map(post=>({id:post.id,kind:'notice',title:post.title,description:post.body,photo:post.photos[0],postId:post.id,label:'AVISO DE CAI',action:'Leer aviso'}))
}
