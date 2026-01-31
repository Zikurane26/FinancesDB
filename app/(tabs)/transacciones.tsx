import { getPersonaActual } from '@/src/lib/persona'
import { supabase } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'
import { Button, Text, TextInput, View } from 'react-native'

type Cuenta = {
  id_cuenta: string
  nombre: string
}


export default function TransaccionesScreen() {
  const [idPersona, setIdPersona] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [idCuenta, setIdCuenta] = useState<string | null>(null)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])


  useEffect(() => {
    const cargarDatos = async () => {
        const personaId = await getPersonaActual()
        setIdPersona(personaId)

        const { data } = await supabase
        .from('cuentas')
        .select('id_cuenta, nombre')

        setCuentas(data || [])
    }

    cargarDatos()
    }, [])


    const crearTransaccion = async () => {
        if (!idPersona || !idCuenta) {
            console.log('❌ Falta persona o cuenta')
            return
        }

        const { error } = await supabase.rpc(
            'crear_transaccion_y_actualizar_saldo',
            {
            p_id_persona: idPersona,
            p_id_cuenta: idCuenta,
            p_id_tipo: 2, // egreso
            p_monto: Number(monto),
            p_descripcion: descripcion,
            p_fecha: new Date().toISOString().split('T')[0],
            }
        )

        if (error) {
            console.log('❌ Error RPC:', error.message)
        } else {
            console.log('✅ Transacción creada y saldo actualizado')
        }
    }


  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>
        Nueva transacción
      </Text>

      <TextInput
        placeholder="Monto"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
            borderColor: '#555',
            marginBottom: 12,
            padding: 10,
            color: '#fff',
            backgroundColor: '#222',
            borderRadius: 6
        }}
      />

      <TextInput
        placeholder="Descripción"
        value={descripcion}
        onChangeText={setDescripcion}
        style={{
            borderWidth: 1,
            borderColor: '#555',
            marginBottom: 12,
            padding: 10,
            color: '#fff',
            backgroundColor: '#222',
            borderRadius: 6
        }}
      />
      <Text style={{ marginBottom: 8 }}>Selecciona una cuenta:</Text>

        {cuentas.map((cuenta) => (
        <Button
            key={cuenta.id_cuenta}
            title={cuenta.nombre}
            onPress={() => setIdCuenta(cuenta.id_cuenta)}
        />
        ))}
        { idCuenta && <Text style={{borderWidth: 1,
            borderColor: '#555',
            marginBottom: 12,
            padding: 10,
            color: '#fff',
            backgroundColor: '#222',
            borderRadius: 6}}>✅ Cuenta seleccionada</Text> }



      <Button title="Guardar transacción" onPress={crearTransaccion} />
    </View>
  )
}
