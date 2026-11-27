import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
const secret = () => { const s=process.env.SESSION_SECRET; if(!s || s.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters'); return new TextEncoder().encode(s); };
export async function issueSession() { return new SignJWT({role:'admin'}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('8h').sign(secret()); }
export async function isAdmin() { try { const token=(await cookies()).get('aigen_admin')?.value; if(!token) return false; const {payload}=await jwtVerify(token,secret()); return payload.role==='admin'; } catch {return false;} }
export function unauthorized(){ return NextResponse.json({error:'Unauthorized'},{status:401}); }
