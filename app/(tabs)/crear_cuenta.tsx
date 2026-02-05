import { useState } from 'react'
import {
  Alert,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { getPersonaActual } from '../../src/lib/persona'
import { supabase } from '../../src/lib/supabase'

/* ───────────────────────────────
   Tipos
─────────────────────────────── */

type TipoCuenta =
  | 'Efectivo'
  | 'Debito'
  | 'Credito'
  | 'Ahorro'
  | 'Inversion'

const TIPOS_CUENTA: TipoCuenta[] = [
  'Efectivo',
  'Debito',
  'Credito',
  'Ahorro',
  'Inversion',
]

/* ───────────────────────────────
   Pantalla
─────────────────────────────── */

export default function CrearCuenta() {
  const [nombre, setNombre] = useState('')
  const [tipoCuenta, setTipoCuenta] =
    useState<TipoCuenta>('Efectivo')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [loading, setLoading] = useState(false)

  /* ───────────────────────────────
     Crear cuenta
  ─────────────────────────────── */

  const crearCuenta = async () => {
    const personaId = await getPersonaActual()

    if (!personaId) {
      Alert.alert('Error', 'No se pudo obtener la persona actual')
      return
    }

    if (!nombre.trim()) {
      Alert.alert('Faltan datos', 'El nombre es obligatorio')
      return
    }

    const saldoNumero = Number(saldoInicial)

    if (isNaN(saldoNumero) || saldoNumero < 0) {
      Alert.alert(
        'Saldo inválido',
        'El saldo inicial debe ser 0 o mayor'
      )
      return
    }

    setLoading(true)

    const { error } = await supabase.from('cuentas').insert({
      nombre: nombre.trim(),
      tipo_cuenta: tipoCuenta,
      saldo_inicial: saldoNumero,
      saldo_actual: saldoNumero,
      id_persona: personaId,
    })

    setLoading(false)

    if (error) {
      console.log('❌ Error creando cuenta:', error.message)
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert('Listo', 'Cuenta creada correctamente')

    /* 🔄 Reset */
    setNombre('')
    setSaldoInicial('')
    setTipoCuenta('Efectivo')
  }

  /* ───────────────────────────────
     Render
  ─────────────────────────────── */

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        Crear cuenta
      </Text>

      <TextInput
        placeholder="Nombre de la cuenta"
        placeholderTextColor="#aaa"
        value={nombre}
        onChangeText={setNombre}
        style={inputStyle}
      />

      <Text style={labelStyle}>Tipo de cuenta</Text>
      {TIPOS_CUENTA.map(tipo => (
        <SelectableButton
          key={tipo}
          label={tipo}
          selected={tipoCuenta === tipo}
          onPress={() => setTipoCuenta(tipo)}
        />
      ))}

      <TextInput
        placeholder="Saldo inicial"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={saldoInicial}
        onChangeText={setSaldoInicial}
        style={inputStyle}
      />

      <Button
        title={loading ? 'Creando...' : 'Crear cuenta'}
        onPress={crearCuenta}
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
  marginTop: 12,
  marginBottom: 6,
  fontWeight: '600' as const,
  color: '#ddd',
}

function SelectableButton({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 10,
        marginBottom: 6,
        borderRadius: 6,
        backgroundColor: selected ? '#4CAF50' : '#333',
      }}
    >
      <Text style={{ color: '#fff' }}>{label}</Text>
    </TouchableOpacity>
  )
}
