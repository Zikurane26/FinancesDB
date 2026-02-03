import { formatMoney } from '@/src/lib/format'
import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { supabase } from '../../src/lib/supabase'

type Cuenta = {
  id_cuenta: string
  nombre: string
  saldo_actual: number
  tipo_cuenta: string
}

export default function CuentasScreen() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  const cargarCuentas = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('cuentas')
      .select('id_cuenta, nombre, saldo_actual, tipo_cuenta')

    if (error) {
      console.log('❌ Error cargando cuentas:', error.message)
    } else {
      setCuentas(data || [])
    }

    setLoading(false)
  }

  // Primera carga
  useEffect(() => {
    cargarCuentas()
  }, [])

  // Cada vez que vuelves a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarCuentas()
    }, [])
  )

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Mis cuentas</Text>

      {loading ? (
        <Text>Cargando...</Text>
      ) : (
        <FlatList
          data={cuentas}
          keyExtractor={(item) => item.id_cuenta}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  borderColor: '#555',
                  marginBottom: 12,
                  padding: 10,
                  color: '#fff',
                  backgroundColor: '#222',
                  borderRadius: 6,
                }}
              >
                {item.nombre}
              </Text>

              <Text
                style={{
                  borderColor: '#555',
                  marginBottom: 12,
                  padding: 10,
                  color: '#fff',
                  backgroundColor: '#222',
                  borderRadius: 6,
                }}
              >
                Tipo: {item.tipo_cuenta}
              </Text>

              <Text
                style={{
                  borderColor: '#555',
                  marginBottom: 12,
                  padding: 10,
                  color: '#fff',
                  backgroundColor: '#222',
                  borderRadius: 6,
                }}
              >
                <Text>Saldo: {formatMoney(item.saldo_actual)}</Text>
              </Text>
            </View>
          )}
        />
      )}
    </View>
  )
}
