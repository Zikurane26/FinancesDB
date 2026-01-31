import { supabase } from './supabase'

export async function getPersonaActual() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('id_persona')
    .eq('user_id', user.id)
    .single()

  return persona
}
