import {SignJWT} from 'jose/jwt/sign';
import {jwtVerify} from 'jose/jwt/verify';
import {cookies} from 'next/headers';
const name='watchtower_session';
const secret=()=>new TextEncoder().encode(process.env.SESSION_SECRET||process.env.AUTH_SECRET||'');
export const authEnabled=()=>Boolean(process.env.AUTH_PASSWORD&&secret().length>=32);
export async function issueSession(){return new SignJWT({scope:'watchtower'}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret())}
export async function validSession(token?:string){if(!authEnabled())return process.env.NODE_ENV!=='production';if(!token)return false;try{const {payload}=await jwtVerify(token,secret());return payload.scope==='watchtower'}catch{return false}}
export async function requireSession(){const token=(await cookies()).get(name)?.value;if(!(await validSession(token)))throw new Error('UNAUTHORIZED')}
export {name as sessionCookie};
