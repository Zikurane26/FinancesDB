import { useEffect } from 'react'
import { Text, View } from 'react-native'
import { supabase } from '../../src/lib/supabase'

export default function Index() {

  useEffect(() => {
    test()
  }, [])

  async function test() {
    const { data, error } = await supabase
      .from('categorias') // usa una tabla que exista
      .select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)
  }

  return (
    <View style={{ marginTop: 50 }}>
      <Text>Finanzas App</Text>
    </View>
  )
}
