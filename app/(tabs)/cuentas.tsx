import { formatMoney } from '@/src/lib/format'
import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { supabase } from '../../src/lib/supabase'

/* ───────────────────────────────
   Tipos
─────────────────────────────── */

type Cuenta = {
  id_cuenta: string
  nombre: string
  saldo_actual: number
  tipo_cuenta: string
  activa: boolean
}

const TIPOS_CUENTA = [
  'Efectivo',
  'Debito',
  'Credito',
  'Ahorro',
  'Inversion',
]

/* ───────────────────────────────
   Pantalla
─────────────────────────────── */

export default function CuentasScreen() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(true)

  /* ✏️ Edición */
  const [editando, setEditando] = useState<Cuenta | null>(null)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('')
  const [activa, setActiva] = useState(true)

  const cargarCuentas = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('cuentas')
      .select('id_cuenta, nombre, saldo_actual, tipo_cuenta, activa')
      .order('created_at')

    if (!error) setCuentas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarCuentas()
  }, [])

  useFocusEffect(
    useCallback(() => {
      cargarCuentas()
    }, [])
  )

  /* ───────────────────────────────
     Guardar cambios
  ─────────────────────────────── */

  const guardarCambios = async () => {
    if (!editando) return

    await supabase
      .from('cuentas')
      .update({
        nombre,
        tipo_cuenta: tipo,
        activa,
      })
      .eq('id_cuenta', editando.id_cuenta)

    setEditando(null)
    cargarCuentas()
  }

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: '#fff' }}>
        Mis cuentas
      </Text>

      {editando && (
        <View
          style={{
            marginBottom: 24,
            padding: 12,
            backgroundColor: '#1e1e1e',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', marginBottom: 8 }}>
            Editar cuenta
          </Text>

          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
            placeholderTextColor="#888"
            style={inputStyle}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIPOS_CUENTA.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTipo(t)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor: tipo === t ? '#444' : '#222',
                }}
              >
                <Text style={{ color: '#fff' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setActiva(a => !a)}
            style={{ marginVertical: 12 }}
          >
            <Text style={{ color: '#fff' }}>
              Estado: {activa ? 'Activa' : 'Inactiva'}
            </Text>
          </TouchableOpacity>

          <Button title="Guardar cambios" onPress={guardarCambios} />
        </View>
      )}

      {loading ? (
        <Text style={{ color: '#fff' }}>Cargando...</Text>
      ) : (
        <FlatList
          data={cuentas}
          keyExtractor={item => item.id_cuenta}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setEditando(item)
                setNombre(item.nombre)
                setTipo(item.tipo_cuenta)
                setActiva(item.activa)
              }}
            >
              <View
                style={{
                  padding: 12,
                  backgroundColor: '#222',
                  borderRadius: 8,
                  marginBottom: 10,
                  opacity: item.activa ? 1 : 0.5,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>
                  {item.nombre}
                </Text>

                <Text style={{ color: '#aaa' }}>
                  Tipo: {item.tipo_cuenta}
                </Text>

                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {formatMoney(item.saldo_actual)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

/* ───────────────────────────────
   Estilos
─────────────────────────────── */

const inputStyle = {
  borderWidth: 1,
  borderColor: '#555',
  marginBottom: 10,
  padding: 10,
  color: '#fff',
  backgroundColor: '#222',
  borderRadius: 6,
}
