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

/* ───────────────────────────────
   Pantalla
─────────────────────────────── */

export default function TransferenciasScreen() {
  const [idPersona, setIdPersona] = useState<string | null>(null)

  const [cuentas, setCuentas] = useState<Cuenta[]>([])

  const [cuentaOrigen, setCuentaOrigen] = useState<string | null>(null)
  const [cuentaDestino, setCuentaDestino] = useState<string | null>(null)

  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [loading, setLoading] = useState(false)

  /* ───────────────────────────────
     Carga inicial
  ─────────────────────────────── */

  useEffect(() => {
    const cargarInicial = async () => {
      const personaId = await getPersonaActual()
      setIdPersona(personaId)

      const { data } = await supabase
        .from('cuentas')
        .select('id_cuenta, nombre')
        .eq('activa', true)
        .order('nombre')

      setCuentas(data || [])
    }

    cargarInicial()
  }, [])

  /* ───────────────────────────────
     Crear transferencia
  ─────────────────────────────── */

  const crearTransferencia = async () => {
    if (!idPersona || !cuentaOrigen || !cuentaDestino || !monto) {
      Alert.alert(
        'Faltan datos',
        'Debes seleccionar cuenta origen, destino y monto'
      )
      return
    }

    if (cuentaOrigen === cuentaDestino) {
      Alert.alert(
        'Cuentas inválidas',
        'La cuenta origen y destino deben ser diferentes'
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
      'crear_transferencia_entre_cuentas',
      {
        p_id_persona: idPersona,
        p_id_cuenta_origen: cuentaOrigen,
        p_id_cuenta_destino: cuentaDestino,
        p_monto: montoNumero,
        p_descripcion: descripcion || null,
        p_fecha: fecha,
      }
    )

    setLoading(false)

    if (error) {
      console.log('❌ Error transferencia:', error.message)
      Alert.alert('Error', error.message)
      return
    }

    /* 🔄 Reset */
    setMonto('')
    setDescripcion('')
    setCuentaOrigen(null)
    setCuentaDestino(null)
    setFecha(new Date().toISOString().split('T')[0])

    Alert.alert('Listo', 'Transferencia realizada correctamente')
  }

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        Transferencia entre cuentas
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

      <Text style={labelStyle}>Cuenta origen</Text>
      {cuentas.map(cuenta => (
        <SelectableButton
          key={cuenta.id_cuenta}
          label={cuenta.nombre}
          selected={cuentaOrigen === cuenta.id_cuenta}
          color="#c62828"
          onPress={() => setCuentaOrigen(cuenta.id_cuenta)}
        />
      ))}

      <Text style={labelStyle}>Cuenta destino</Text>
      {cuentas.map(cuenta => (
        <SelectableButton
          key={cuenta.id_cuenta}
          label={cuenta.nombre}
          selected={cuentaDestino === cuenta.id_cuenta}
          color="#2e7d32"
          onPress={() => setCuentaDestino(cuenta.id_cuenta)}
        />
      ))}

      <Button
        title={loading ? 'Procesando...' : 'Transferir'}
        onPress={crearTransferencia}
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
