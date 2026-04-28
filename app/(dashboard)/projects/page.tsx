import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectList } from '@/components/projects/ProjectList'
import type { Project } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <ProjectList initialProjects={(projects ?? []) as Project[]} userId={user.id} />
}
