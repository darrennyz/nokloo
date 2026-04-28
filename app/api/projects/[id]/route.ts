import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthedProject(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, project: null }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return { supabase, user, project }
}

// PATCH — archive or restore
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user, project } = await getAuthedProject(id)

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if ('archived_at' in body) updates.archived_at = body.archived_at ?? null
  if (body.name?.trim()) updates.name = body.name.trim()
  if ('description' in body) updates.description = body.description?.trim() || null
  if (body.status) updates.status = body.status

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data })
}

// DELETE — permanent delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, user, project } = await getAuthedProject(id)

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
