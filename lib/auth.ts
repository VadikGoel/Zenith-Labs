import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from './db';
const COOKIE='zenith_session';
export function hashPassword(password:string){const salt=randomBytes(16);const key=scryptSync(password,salt,64);return `${salt.toString('hex')}:${key.toString('hex')}`}
export function verifyPassword(password:string,stored:string){const [s,k]=stored.split(':');if(!s||!k)return false;const key=scryptSync(password,Buffer.from(s,'hex'),64);const expected=Buffer.from(k,'hex');return expected.length===key.length&&timingSafeEqual(expected,key)}
export function hashToken(token:string){return createHash('sha256').update(token).digest('hex')}
export async function createSession(learnerId:string){const token=randomBytes(32).toString('base64url');await query('insert into sessions(learner_id,token_hash,expires_at) values($1,$2,now()+interval \'30 days\')',[learnerId,hashToken(token)]);(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30});return token}
export async function currentLearner(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const r=await query<{id:string;email:string;display_name:string|null}>('select l.id,l.email,l.display_name from sessions s join learners l on l.id=s.learner_id where s.token_hash=$1 and s.expires_at>now()',[hashToken(token)]);return r.rows[0]??null}
export async function destroySession(){const c=await cookies();const token=c.get(COOKIE)?.value;if(token)await query('delete from sessions where token_hash=$1',[hashToken(token)]);c.delete(COOKIE)}
