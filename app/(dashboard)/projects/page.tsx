import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectList } from '@/components/projects/ProjectList'
import type { Project } from '@/types'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: active }, { data: archived }] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('updated_at', { ascending: false }),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false }),
  ])

  return (
    <div className="h-full overflow-y-auto">
      <ProjectList
        initialProjects={(active ?? []) as Project[]}
        initialArchived={(archived ?? []) as Project[]}
        userId={user.id}
      />
    </div>
  )
}
