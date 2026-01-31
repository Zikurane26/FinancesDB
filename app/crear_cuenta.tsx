import { useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'
import { getPersonaActual } from '../src/lib/persona'
import { supabase } from '../src/lib/supabase'

export default function CrearCuenta() {
  const [nombre, setNombre] = useState('')
  const [saldo, setSaldo] = useState('')

  const crearCuenta = async () => {
    const persona = await getPersonaActual()

    if (!persona) {
      console.log('❌ No se encontró persona')
      return
    }

    const { error } = await supabase.from('cuentas').insert({
      nombre,
      tipo_cuenta: 'Efectivo',
      saldo_inicial: Number(saldo),
      saldo_actual: Number(saldo),
      id_persona: persona.id_persona,
    })

    if (error) {
      console.log('❌ Error creando cuenta:', error.message)
    } else {
      console.log('✅ Cuenta creada correctamente')
      setNombre('')
      setSaldo('')
      const { data } = await supabase.from('cuentas').select('*')
        console.log(data)
    }
  }

  return (
    <View style={{ padding: 24 }}>
      <Text>Crear cuenta</Text>

      <TextInput
        placeholder="Nombre de la cuenta"
        value={nombre}
        onChangeText={setNombre}
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
        placeholder="Saldo inicial"
        keyboardType="numeric"
        value={saldo}
        onChangeText={setSaldo}
        style={{ borderWidth: 1,
            borderColor: '#555',
            marginBottom: 12,
            padding: 10,
            color: '#fff',
            backgroundColor: '#222',
            borderRadius: 6
        }}
      />

      <Button title="Crear cuenta" onPress={crearCuenta} />
    </View>
  )
}
