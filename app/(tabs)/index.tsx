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
const CURRENT_YEAR = new Date().getFullYear()

type Cuenta = {
  id_cuenta: string
  nombre: string
}

type Vista = 'ANUAL' | 'MENSUAL'

export default function Index() {
  const [dark, setDark] = useState(false)
  const [vista, setVista] = useState<Vista>('ANUAL')

  const [mes, setMes] = useState(new Date())
  const [anio, setAnio] = useState<number>(CURRENT_YEAR)

  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [cuentaId, setCuentaId] = useState<string>('ALL')

  const [resumen, setResumen] = useState<any>(null)
  const [labels, setLabels] = useState<string[]>([])
  const [evolucion, setEvolucion] = useState<number[]>([])

  const fadeAnim = useRef(new Animated.Value(0)).current

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

  /* 🔄 Cargar datos */
  useEffect(() => {
    cargarTodo()
  }, [mes, anio, cuentaId, vista])

  const cargarTodo = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start()

    const month = mes.getMonth() + 1
    const cuentaParam = cuentaId === 'ALL' ? null : cuentaId

    /* 🏦 Cuentas */
    const { data: cuentasData } = await supabase
      .from('cuentas')
      .select('id_cuenta, nombre')

    setCuentas(cuentasData || [])

    /* 📊 Resumen (sigue siendo mensual, incluso en vista anual) */
    const { data: resumenData } = await supabase.rpc('resumen_mes', {
      p_mes: month,
      p_anio: anio,
      p_cuenta_id: cuentaParam,
    })

    setResumen(resumenData?.[0] || null)

    /* 📈 EVOLUCIÓN */
    if (vista === 'ANUAL') {
      const { data } = await supabase.rpc('evolucion_mensual_anio', {
        p_anio: anio,
        p_cuenta_id: cuentaParam,
      })

      setLabels(
        data?.map((d: any) =>
          new Date(anio, d.mes - 1).toLocaleString('es-CO', { month: 'short' })
        ) || []
      )

      setEvolucion(data?.map((d: any) => d.total) || [])
    } else {
      const { data } = await supabase.rpc('evolucion_diaria_mes', {
        p_mes: month,
        p_anio: anio,
        p_cuenta_id: cuentaParam,
      })

      setLabels(data?.map((_: any, i: number) => `${i + 1}`) || [])
      setEvolucion(data?.map((d: any) => d.total) || [])
    }

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

  const cambiarAnio = (delta: number) => {
    setAnio(prev => prev + delta)
  }

  if (!resumen) return <Text>Cargando…</Text>

  const balance = resumen.ingresos - resumen.egresos
  const variacion = resumen.variacion || 0

  return (
    <ScrollView style={styles(dark).container}>
      {/* 🔁 Selector vista */}
      <View style={styles(dark).row}>
        <TouchableOpacity onPress={() => setVista('ANUAL')}>
          <Text style={{ fontWeight: vista === 'ANUAL' ? '700' : '400' }}>
            ANUAL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVista('MENSUAL')}>
          <Text style={{ fontWeight: vista === 'MENSUAL' ? '700' : '400' }}>
            MENSUAL
          </Text>
        </TouchableOpacity>
      </View>

      {/* 📆 Año */}
      <View style={styles(dark).row}>
        <TouchableOpacity onPress={() => cambiarAnio(-1)}>
          <Text style={styles(dark).nav}>←</Text>
        </TouchableOpacity>
        <Text style={styles(dark).title}>{anio}</Text>
        <TouchableOpacity onPress={() => cambiarAnio(1)}>
          <Text style={styles(dark).nav}>→</Text>
        </TouchableOpacity>
      </View>

      {/* 📅 Mes (solo mensual) */}
      {vista === 'MENSUAL' && (
        <View style={styles(dark).row}>
          <TouchableOpacity onPress={() => cambiarMes(-1)}>
            <Text style={styles(dark).nav}>←</Text>
          </TouchableOpacity>
          <Text style={styles(dark).title}>
            {mes.toLocaleString('es-CO', { month: 'long' })}
          </Text>
          <TouchableOpacity onPress={() => cambiarMes(1)}>
            <Text style={styles(dark).nav}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🌙 Toggle */}
      <TouchableOpacity onPress={toggleTheme}>
        <Text style={styles(dark).toggle}>
          {dark ? '🌙 Oscuro' : '☀️ Claro'}
        </Text>
      </TouchableOpacity>

      {/* 🏦 Cuenta */}
      <Picker selectedValue={cuentaId} onValueChange={setCuentaId}>
        <Picker.Item label="Todas las cuentas" value="ALL" />
        {cuentas.map(c => (
          <Picker.Item key={c.id_cuenta} label={c.nombre} value={c.id_cuenta} />
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

        {/* 📈 Gráfica */}
        <LineChart
          data={{
            labels,
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
      marginBottom: 8,
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
