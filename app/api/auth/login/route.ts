import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){try{const b=await req.json();const email=String(b.email||'').trim().toLowerCase();const password=String(b.password||'');const r=await query<{id:string;password_hash:string}>('select id,password_hash from learners where email=$1',[email]);const row=r.rows[0];if(!row||!verifyPassword(password,row.password_hash))return NextResponse.json({error:'Invalid email or password.'},{status:401});await createSession(row.id);return NextResponse.json({ok:true})}catch(e){console.error('login',e);return NextResponse.json({error:'Database is unavailable. Configure DATABASE_URL and apply db/schema.sql.'},{status:503})}}
