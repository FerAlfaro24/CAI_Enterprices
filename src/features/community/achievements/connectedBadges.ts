import type { CommunityConnection } from '../connection'
import type { BadgeGrant } from './types'
export const connectedGrants=(connection:CommunityConnection):BadgeGrant[]=>connection.badges.grants.filter(g=>g.status==='active').map(g=>({id:g.id,badgeId:g.badge.id,memberId:connection.user.publicId,source:g.source,condition:g.condition,awardedAt:g.awardedAt}))
export function connectedRequestBlock(connection:CommunityConnection,id:string){
 const item=connection.badges.grants.find(g=>g.badge.id===id)
 if(item)return item.status==='active'?'Ya conseguiste esta insignia.':'Esta insignia fue retirada. Consulta con coordinación.'
 if(connection.badges.pendingBadgeIds.includes(id))return 'Esta insignia ya tiene una solicitud en revisión.'
 return undefined
}
