import { supabase } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'
import {
  Button,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

/* ───────────────────────────────
   Tipos
─────────────────────────────── */

type Cuenta = {
  id_cuenta: string
  nombre: string
}

type TipoMovimiento = {
  id_tipo: number
  nombre: string
}

type Transaccion = {
  id_transaccion: string
  fecha: string
  descripcion: string | null
  monto: number
  id_tipo: number
}

/* ───────────────────────────────
   Helpers
─────────────────────────────── */

const colorPorTipo = (idTipo: number) => {
  switch (idTipo) {
    case 1:
      return '#2e7d32'
    case 2:
      return '#c62828'
    case 3:
      return '#1565c0'
    case 4:
      return '#6a1b9a'
    default:
      return '#999'
  }
}

const signoPorTipo = (idTipo: number) =>
  idTipo === 1 ? '+' : '-'

/* ───────────────────────────────
   Pantalla
─────────────────────────────── */

export default function MovimientosScreen() {
  const hoy = new Date()

  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [tipos, setTipos] = useState<TipoMovimiento[]>([])

  const [cuentaSeleccionada, setCuentaSeleccionada] =
    useState<Cuenta | null>(null)

  const [transacciones, setTransacciones] =
    useState<Transaccion[]>([])

  const [anio, setAnio] = useState(hoy.getFullYear())
  const [loading, setLoading] = useState(false)

  /* ✏️ Edición */
  const [editando, setEditando] =
    useState<Transaccion | null>(null)

  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [idTipo, setIdTipo] = useState<number | null>(null)

  /* ───────────────────────────────
     Cargar datos base
  ─────────────────────────────── */

  useEffect(() => {
    const cargarBase = async () => {
      const { data: cuentasDB } = await supabase
        .from('cuentas')
        .select('id_cuenta, nombre')
        .order('nombre')

      const { data: tiposDB } = await supabase
        .from('tipos_movimiento')
        .select('id_tipo, nombre')
        .order('id_tipo')

      setCuentas(cuentasDB || [])
      setTipos(tiposDB || [])
    }

    cargarBase()
  }, [])

  useEffect(() => {
    if (cuentaSeleccionada) {
      cargarTransacciones(cuentaSeleccionada)
    }
  }, [anio])

  /* ───────────────────────────────
     Cargar transacciones
  ─────────────────────────────── */

  const cargarTransacciones = async (cuenta: Cuenta) => {
    setCuentaSeleccionada(cuenta)
    setLoading(true)

    const { data } = await supabase
      .from('transacciones')
      .select('id_transaccion, fecha, descripcion, monto, id_tipo')
      .eq('id_cuenta', cuenta.id_cuenta)
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`)
      .order('fecha', { ascending: false })

    setTransacciones(data || [])
    setLoading(false)
  }

  /* ───────────────────────────────
     Guardar edición
  ─────────────────────────────── */

  const actualizarTransaccion = async () => {
    if (!editando || idTipo === null) return

    await supabase
      .from('transacciones')
      .update({
        monto: Number(monto),
        descripcion: descripcion || null,
        id_tipo: idTipo,
      })
      .eq('id_transaccion', editando.id_transaccion)

    setEditando(null)
    setMonto('')
    setDescripcion('')
    setIdTipo(null)

    if (cuentaSeleccionada) {
      cargarTransacciones(cuentaSeleccionada)
    }
  }

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, color: '#fff', marginBottom: 12 }}>
        Movimientos
      </Text>

      {/* Año */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <Button title="←" onPress={() => setAnio(a => a - 1)} />
        <Text style={{ color: '#fff', fontSize: 16 }}>{anio}</Text>
        <Button title="→" onPress={() => setAnio(a => a + 1)} />
      </View>

      {/* Cuentas */}
      {cuentas.map(c => (
        <Button
          key={c.id_cuenta}
          title={c.nombre}
          onPress={() => cargarTransacciones(c)}
        />
      ))}

      {/* ✏️ Editor */}
      {editando && (
        <View style={{ marginVertical: 16 }}>
          <Text style={{ color: '#fff', marginBottom: 8 }}>
            Editar transacción
          </Text>

          {/* Tipo */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {tipos.map(t => (
              <TouchableOpacity
                key={t.id_tipo}
                onPress={() => setIdTipo(t.id_tipo)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor:
                    idTipo === t.id_tipo ? '#444' : '#222',
                }}
              >
                <Text style={{ color: '#fff' }}>{t.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={monto}
            onChangeText={setMonto}
            keyboardType="numeric"
            placeholder="Monto"
            placeholderTextColor="#888"
            style={inputStyle}
          />

          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción"
            placeholderTextColor="#888"
            style={inputStyle}
          />

          <Button title="Guardar cambios" onPress={actualizarTransaccion} />
        </View>
      )}

      {/* Listado */}
      <FlatList
        data={transacciones}
        keyExtractor={i => i.id_transaccion}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setEditando(item)
              setMonto(String(item.monto))
              setDescripcion(item.descripcion || '')
              setIdTipo(item.id_tipo)
            }}
          >
            <View
              style={{
                padding: 12,
                backgroundColor: '#1e1e1e',
                marginBottom: 8,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff' }}>
                {item.descripcion || 'Sin descripción'}
              </Text>
              <Text style={{ color: '#aaa' }}>
                {new Date(item.fecha).toLocaleDateString('es-CO')}
              </Text>
              <Text
                style={{
                  color: colorPorTipo(item.id_tipo),
                  fontWeight: '700',
                }}
              >
                {signoPorTipo(item.id_tipo)}${item.monto}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#555',
  marginBottom: 8,
  padding: 10,
  color: '#fff',
  backgroundColor: '#222',
  borderRadius: 6,
}
