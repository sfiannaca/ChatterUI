import { View, Text, StyleSheet, TextInput } from 'react-native'
import { useMMKVString } from 'react-native-mmkv'
import { Global, Color, API} from '@globals'

const TGWUI = () => {
    
    const [blockEnd, setBlockEnd] = useMMKVString(Global.TGWUIBlockingEndpoint)
    const [streamEnd, setStreamEnd] = useMMKVString(Global.TGWUIStreamingEndpoint)

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>Endpoint</Text>

            <TextInput 
                style={styles.input}
                value={blockEnd}
                onChangeText={(value) => {
                    setBlockEnd(value)
                }}
                placeholder='eg. http://127.0.0.1:5000/api'
                placeholderTextColor={Color.Offwhite}
            />

            <Text style={styles.title}>Endpoint</Text>

            <TextInput 
                style={styles.input}
                value={streamEnd}
                onChangeText={(value) => {
                    setStreamEnd(value)
                }}
                placeholder='eg. http://127.0.0.1:5005/api/v1/stream'
                placeholderTextColor={Color.Offwhite}
            />

            
        </View>
    )
}

export default TGWUI

const styles = StyleSheet.create({
    mainContainer : {
        marginVertical:16,
        paddingVertical:16, 
        paddingHorizontal:20,
    },

    title : {
        color: Color.Text
    },

    input: {
        color: Color.Text,
        backgroundColor: Color.DarkContainer,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginVertical:8,
        borderRadius: 8,
    },

   
})