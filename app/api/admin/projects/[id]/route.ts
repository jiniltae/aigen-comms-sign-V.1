import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {isAdmin,unauthorized} from '@/lib/auth';
import {db} from '@/lib/db';
const schema=z.object({slug:z.string().regex(/^[a-z0-9-]{3,80}$/),title:z.string().min(2).max(150),category:z.string().min(1).max(50),region:z.string().max(100).optional(),description:z.string().max(5000),published:z.boolean(),images:z.array(z.object({url:z.string().url(),alt:z.string().max(200)})).max(30)});
type Ctx={params:Promise<{id:string}>};
export async function PATCH(req:NextRequest,{params}:Ctx){if(!await isAdmin())return unauthorized();const {id}=await params;const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'입력값을 확인하세요.'},{status:400});const {images,...fields}=parsed.data;try{const result=await db.$transaction(async tx=>{await tx.projectImage.deleteMany({where:{projectId:id}});return tx.project.update({where:{id},data:{...fields,images:{create:images.map((img,sort)=>({...img,sort}))}}});});return NextResponse.json(result)}catch{return NextResponse.json({error:'수정 실패: 주소 중복 또는 저장소 연결을 확인하세요.'},{status:400})}}
export async function DELETE(_req:NextRequest,{params}:Ctx){if(!await isAdmin())return unauthorized();const {id}=await params;try{await db.project.delete({where:{id}});return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'삭제 실패'},{status:400})}}
