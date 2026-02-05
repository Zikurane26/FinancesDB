import { getPersonaActual } from '@/src/lib/persona'
import { supabase } from '@/src/lib/supabase'
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
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

type Categoria = {
  id_categoria: string
  nombre: string
  id_tipo: number
}

/* ───────────────────────────────
   Pantalla
─────────────────────────────── */

export default function TransaccionesScreen() {
  const [idPersona, setIdPersona] = useState<string | null>(null)

  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [idCuenta, setIdCuenta] = useState<string | null>(null)

  const [tipos, setTipos] = useState<TipoMovimiento[]>([])
  const [idTipo, setIdTipo] = useState<number | null>(null)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [idCategoria, setIdCategoria] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  /* ───────────────────────────────
     Carga inicial
  ─────────────────────────────── */

  useEffect(() => {
    const cargarInicial = async () => {
      const personaId = await getPersonaActual()
      setIdPersona(personaId)

      const { data: cuentasData } = await supabase
        .from('cuentas')
        .select('id_cuenta, nombre')
        .eq('activa', true)
        .order('nombre')

      setCuentas(cuentasData || [])

      const { data: tiposData } = await supabase
        .from('tipos_movimiento')
        .select('id_tipo, nombre')
        .order('id_tipo')

      setTipos(tiposData || [])
    }

    cargarInicial()
  }, [])

  /* ───────────────────────────────
     Categorías dependientes del tipo
  ─────────────────────────────── */

  useEffect(() => {
    if (!idTipo) {
      setCategorias([])
      setIdCategoria(null)
      return
    }

    const cargarCategorias = async () => {
      const { data } = await supabase
        .from('categorias')
        .select('id_categoria, nombre, id_tipo')
        .eq('id_tipo', idTipo)
        .order('nombre')

      setCategorias(data || [])
      setIdCategoria(null)
    }

    cargarCategorias()
  }, [idTipo])

  /* ───────────────────────────────
     Crear transacción
  ─────────────────────────────── */

  const crearTransaccion = async () => {
    if (!idPersona || !idCuenta || !idTipo || !monto) {
      Alert.alert(
        'Faltan datos',
        'Monto, tipo y cuenta son obligatorios'
      )
      return
    }

    const montoNumero = Number(monto)

    if (isNaN(montoNumero) || montoNumero <= 0) {
      Alert.alert('Monto inválido', 'El monto debe ser mayor a 0')
      return
    }

    setLoading(true)

    const { error } = await supabase.rpc(
      'crear_transaccion_y_actualizar_saldo',
      {
        p_id_persona: idPersona,
        p_id_cuenta: idCuenta,
        p_id_tipo: idTipo,
        p_id_categoria: idCategoria,
        p_monto: montoNumero,
        p_descripcion: descripcion || null,
        p_fecha: fecha,
      }
    )

    setLoading(false)

    if (error) {
      console.log('❌ Error RPC:', error.message)
      Alert.alert('Error', error.message)
      return
    }

    /* 🔄 Reset controlado */
    setMonto('')
    setDescripcion('')
    setIdCuenta(null)
    setIdTipo(null)
    setCategorias([])
    setIdCategoria(null)
    setFecha(new Date().toISOString().split('T')[0])

    Alert.alert('Listo', 'Transacción registrada correctamente')
  }

  /* ───────────────────────────────
     Helpers UI
  ─────────────────────────────── */

  const colorPorTipo = (tipoId: number | null) => {
    switch (tipoId) {
      case 1:
        return '#2e7d32' // Ingreso
      case 2:
        return '#c62828' // Egreso
      case 3:
        return '#1565c0' // Ahorro
      case 4:
        return '#6a1b9a' // Transferencia
      default:
        return '#333'
    }
  }

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        Nueva transacción
      </Text>

      <TextInput
        placeholder="Monto"
        placeholderTextColor="#aaa"
        value={monto}
        onChangeText={setMonto}
        keyboardType="numeric"
        style={inputStyle}
      />

      <TextInput
        placeholder="Descripción (opcional)"
        placeholderTextColor="#aaa"
        value={descripcion}
        onChangeText={setDescripcion}
        style={inputStyle}
      />

      <TextInput
        placeholder="Fecha (YYYY-MM-DD)"
        placeholderTextColor="#aaa"
        value={fecha}
        onChangeText={setFecha}
        style={inputStyle}
      />

      <Text style={labelStyle}>Tipo de movimiento</Text>
      {tipos.map(tipo => (
        <SelectableButton
          key={tipo.id_tipo}
          label={tipo.nombre}
          selected={idTipo === tipo.id_tipo}
          color={colorPorTipo(tipo.id_tipo)}
          onPress={() => setIdTipo(tipo.id_tipo)}
        />
      ))}

      {categorias.length > 0 && (
        <>
          <Text style={labelStyle}>Categoría</Text>
          {categorias.map(cat => (
            <SelectableButton
              key={cat.id_categoria}
              label={cat.nombre}
              selected={idCategoria === cat.id_categoria}
              onPress={() => setIdCategoria(cat.id_categoria)}
            />
          ))}
        </>
      )}

      <Text style={labelStyle}>Cuenta</Text>
      {cuentas.map(cuenta => (
        <SelectableButton
          key={cuenta.id_cuenta}
          label={cuenta.nombre}
          selected={idCuenta === cuenta.id_cuenta}
          onPress={() => setIdCuenta(cuenta.id_cuenta)}
        />
      ))}

      <Button
        title={loading ? 'Guardando...' : 'Guardar transacción'}
        onPress={crearTransaccion}
        disabled={loading}
      />
    </View>
  )
}

/* ───────────────────────────────
   Componentes UI
─────────────────────────────── */

const inputStyle = {
  borderWidth: 1,
  borderColor: '#555',
  marginBottom: 12,
  padding: 10,
  color: '#fff',
  backgroundColor: '#222',
  borderRadius: 6,
}

const labelStyle = {
  marginTop: 14,
  marginBottom: 6,
  fontWeight: '600' as const,
  color: '#ddd',
}

function SelectableButton({
  label,
  selected,
  onPress,
  color,
}: {
  label: string
  selected: boolean
  onPress: () => void
  color?: string
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 10,
        marginBottom: 6,
        borderRadius: 6,
        backgroundColor: selected ? color || '#4CAF50' : '#333',
      }}
    >
      <Text style={{ color: '#fff' }}>{label}</Text>
    </TouchableOpacity>
  )
}
