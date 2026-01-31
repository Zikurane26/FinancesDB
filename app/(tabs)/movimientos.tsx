import { supabase } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'
import { Button, FlatList, Text, View } from 'react-native'

type Cuenta = {
  id_cuenta: string
  nombre: string
}

type Transaccion = {
  id_transaccion: string
  fecha: string
  descripcion: string
  monto: number
  id_tipo: number
}

export default function MovimientosScreen() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | null>(null)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cargarCuentas = async () => {
      const { data } = await supabase
        .from('cuentas')
        .select('id_cuenta, nombre')

      setCuentas(data || [])
    }

    cargarCuentas()
  }, [])

  const cargarTransacciones = async (idCuenta: string) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('transacciones')
      .select('id_transaccion, fecha, descripcion, monto, id_tipo')
      .eq('id_cuenta', idCuenta)
      .order('fecha', { ascending: false })

    if (error) {
      console.log('❌ Error cargando transacciones:', error.message)
    } else {
      setTransacciones(data || [])
    }

    setLoading(false)
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: '#fff'}}>
        Movimientos
      </Text>

      <Text style={{ marginBottom: 8 }}>Selecciona una cuenta:</Text>

      {cuentas.map((cuenta) => (
        <Button
          key={cuenta.id_cuenta}
          title={cuenta.nombre}
          onPress={() => {
            setCuentaSeleccionada(cuenta.id_cuenta)
            cargarTransacciones(cuenta.id_cuenta)
          }}
        />
      ))}

      {loading && <Text>Cargando movimientos...</Text>}

      {!loading && (
        <FlatList
          data={transacciones}
          keyExtractor={(item) => item.id_transaccion}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <Text style={{
                borderWidth: 1,
                borderColor: '#555',
                marginBottom: 1,
                padding: 10,
                color: '#fff',
                backgroundColor: '#222',
                borderRadius: 6}}>{item.descripcion || 'Sin descripción'}</Text>
              <Text style={{
                borderWidth: 1,
                borderColor: '#555',
                marginBottom: 1,
                padding: 10,
                color: '#fff',
                backgroundColor: '#222',
                borderRadius: 6}}>Fecha: {item.fecha}</Text>
              <Text style={{
                borderWidth: 1,
                borderColor: '#555',
                marginBottom: 10,
                padding: 10,
                color: '#fff',
                backgroundColor: '#222',
                borderRadius: 6}}>Monto: ${item.monto}</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}
