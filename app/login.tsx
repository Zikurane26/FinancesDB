import { router } from 'expo-router'
import { useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'
import { supabase } from '../src/lib/supabase'


export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
  setLoading(true)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log('❌ Error login:', error.message)
  } else {
    console.log('✅ Usuario logueado:', data.user)

    //const session = await supabase.auth.getUser()
    //console.log('🧠 Sesión actual:', session.data.user)
    await ensurePersona()
     // 🔍 PRUEBA RLS (TEMPORAL)
    const { data: personas } = await supabase
    .from('personas')
    .select('*')

    const { data: cuentas, error } = await supabase
    .from('cuentas')
    .select('*')

    console.log('💳 Cuentas visibles:', cuentas)
    console.log('❌ Error:', error)
    await ensurePersona()

    // ✅ REDIRECCIÓN
    router.replace('/(tabs)')

    
  }

  setLoading(false)
}

  

  return (
    <View style={{ padding: 24, flex: 1, backgroundColor: '#000' }}>
      <Text>Login</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1,
            borderColor: '#555',
            marginBottom: 12,
            padding: 10,
            color: '#fff',
            backgroundColor: '#222',
            borderRadius: 6
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1,
            borderColor: '#555',
            marginBottom: 12,
            padding: 10,
            color: '#fff',
            backgroundColor: '#222',
            borderRadius: 6
        }}
      />

      <Button
        title={loading ? 'Entrando...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  )
}

const ensurePersona = async () => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) return

  // 1️⃣ Ver si ya existe persona
  const { data: personaExistente } = await supabase
    .from('personas')
    .select('id_persona')
    .eq('user_id', user.id)
    .maybeSingle()

  if (personaExistente) {
    console.log('👤 Persona ya existe:', personaExistente.id_persona)
    return
  }
  

  // 2️⃣ Crear persona
  const { error } = await supabase.from('personas').insert({
    user_id: user.id,
    email: user.email,
    nombre: user.email?.split('@')[0], // provisional
  })

  if (error) {
    console.log('❌ Error creando persona:', error.message)
  } else {
    console.log('✅ Persona creada correctamente')
  }
}


