import AsyncStorage from '@react-native-async-storage/async-storage'
import { Picker } from '@react-native-picker/picker'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { formatMoney } from '../../src/lib/format'
import { supabase } from '../../src/lib/supabase'

const screenWidth = Dimensions.get('window').width

type Cuenta = {
  id_cuenta: string
  nombre: string
}

export default function Index() {
  const [dark, setDark] = useState(false)
  const [mes, setMes] = useState(new Date())
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cuentaId, setCuentaId] = useState<string>('ALL')
  const [resumen, setResumen] = useState<any>(null)
  const [evolucion, setEvolucion] = useState<number[]>([])
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [vista, setVista] = useState<'ANUAL' | 'MENSUAL'>('ANUAL')
  const anio = mes.getFullYear()
  const mesNum = vista === 'MENSUAL' ? mes.getMonth() + 1 : null



  /* 🌙 Tema persistente */
  useEffect(() => {
    AsyncStorage.getItem('theme').then(v => {
      if (v) setDark(v === 'dark')
    })
  }, [])

  const toggleTheme = async () => {
    const value = !dark
    setDark(value)
    await AsyncStorage.setItem('theme', value ? 'dark' : 'light')
  }

  /* 📅 Cargar datos */
  useEffect(() => {
    cargarTodo()
  }, [mes, cuentaId])

  const cargarTodo = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start()

    const month = mes.getMonth() + 1
    const year = mes.getFullYear()

    /* 🏦 Cuentas */
    const { data: cuentasData } = await supabase
      .from('cuentas')
      .select('id_cuenta, nombre')

    setCuentas(cuentasData || [])

    /* 📊 Resumen */
    const { data: resumenData, error: resumenError } =
      await supabase.rpc('resumen_mes', {
        p_mes: month,
        p_anio: year,
        p_cuenta_id: cuentaId === 'ALL' ? null : cuentaId,
      })

    if (resumenError) {
      console.log('❌ Error resumen:', resumenError.message)
    }

    setResumen(resumenData?.[0] || null)

    /* 📈 Evolución diaria */
    console.log('Cuenta enviada:', cuentaId === 'ALL' ? null : cuentaId)

    const { data: evoData, error: evoError } = await supabase.rpc(
      'evolucion_diaria_mes',
      {
        p_mes: month,
        p_anio: year,
        p_cuenta_id: cuentaId === 'ALL' ? null : cuentaId,
      }
    )

    if (evoError) {
      console.log('❌ Error evolución:', evoError.message)
    }

    setEvolucion(evoData?.map((d: any) => d.total) || [])


    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const cambiarMes = (delta: number) => {
    const nuevo = new Date(mes)
    nuevo.setMonth(nuevo.getMonth() + delta)
    setMes(nuevo)
  }

  if (!resumen) return <Text>Cargando…</Text>

  const balance = resumen.ingresos - resumen.egresos
  const variacion = resumen.variacion || 0

  return (
    <ScrollView style={styles(dark).container}>
      {/* 📅 Selector mes */}
      <View style={styles(dark).row}>
        <TouchableOpacity onPress={() => cambiarMes(-1)}>
          <Text style={styles(dark).nav}>←</Text>
        </TouchableOpacity>

        <Text style={styles(dark).title}>
          {mes.toLocaleString('es-CO', { month: 'long', year: 'numeric' })}
        </Text>

        <TouchableOpacity onPress={() => cambiarMes(1)}>
          <Text style={styles(dark).nav}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 🌙 Toggle */}
      <TouchableOpacity onPress={toggleTheme}>
        <Text style={styles(dark).toggle}>
          {dark ? '🌙 Oscuro' : '☀️ Claro'}
        </Text>
      </TouchableOpacity>

      {/* 🏦 Selector cuenta */}
      <Picker selectedValue={cuentaId} onValueChange={setCuentaId}>
      <Picker.Item label="Todas las cuentas" value="ALL" />
      {cuentas.map(c => (
        <Picker.Item
          key={c.id_cuenta}
          label={c.nombre}
          value={c.id_cuenta}
        />
      ))}
    </Picker>


      <Animated.View style={{ opacity: fadeAnim }}>
        {/* 📊 KPI */}
        <View style={styles(dark).card}>
          <Text>Balance</Text>
          <Text style={styles(dark).balance}>{formatMoney(balance)}</Text>
          <Text style={{ color: variacion >= 0 ? 'green' : 'red' }}>
            {variacion >= 0 ? '↑' : '↓'} {Math.abs(variacion)}%
          </Text>
        </View>

        {/* 📈 Evolución */}
        <LineChart
          data={{
            labels: evolucion.map((_, i) => `${i + 1}`),
            datasets: [{ data: evolucion }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig(dark)}
          style={styles(dark).chart}
        />
      </Animated.View>
    </ScrollView>
  )
}

/* 🎨 */
const chartConfig = (dark: boolean) => ({
  backgroundGradientFrom: dark ? '#121212' : '#fff',
  backgroundGradientTo: dark ? '#121212' : '#fff',
  color: () => (dark ? '#90caf9' : '#1976d2'),
  labelColor: () => (dark ? '#fff' : '#000'),
})

const styles = (dark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: dark ? '#121212' : '#f5f5f5',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: dark ? '#fff' : '#000',
      textTransform: 'capitalize',
    },
    nav: {
      fontSize: 24,
      color: dark ? '#fff' : '#000',
    },
    toggle: {
      marginVertical: 8,
      fontSize: 16,
    },
    card: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: dark ? '#1e1e1e' : '#fff',
      marginVertical: 12,
    },
    balance: {
      fontSize: 22,
      fontWeight: '700',
    },
    chart: {
      marginVertical: 16,
      borderRadius: 12,
    },
  })
