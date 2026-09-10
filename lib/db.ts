import { Pool } from 'pg';
let pool:Pool|undefined;
export function db(){if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is not configured');if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false},max:5});return pool}
export async function query<T=unknown>(text:string,params:any[]=[]){return db().query<T>(text,params)}
