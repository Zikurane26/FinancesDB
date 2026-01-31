import { supabase } from './supabase'

export async function getPersonaActual(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) return null

  const { data, error } = await supabase
    .from('personas')
    .select('id_persona')
    .eq('user_id', userData.user.id)
    .single()

  if (error) {
    console.log('❌ Error obteniendo persona:', error.message)
    return null
  }

  return data.id_persona
}
