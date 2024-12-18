import { Alert } from '@components/Alert'
import FadeDownView from '@components/FadeDownView'
import { defaultTemplates } from '@constants/API/DefaultAPI'
import { AppMode, AppSettings } from '@constants/GlobalValues'
import { FontAwesome } from '@expo/vector-icons'
import { API, Global, Logger, Presets, saveStringExternal, Style } from '@globals'
import { APIState as APIStateNew } from 'app/constants/API/APIManagerState'
import { APIState } from 'app/constants/APIState'
import { SamplerPreset, Samplers } from 'app/constants/SamplerData'
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { useMMKVBoolean, useMMKVObject, useMMKVString } from 'react-native-mmkv'

import { CheckboxTitle, SliderItem, TextBox, TextBoxModal } from './components'

type PresetLabel = {
    label: string
}

const SamplerMenu = () => {
    const [APIType, setAPIType] = useMMKVString(Global.APIType)
    const [appMode, setAppMode] = useMMKVString(Global.AppMode)
    const [presetName, setPresetName] = useMMKVString(Global.PresetName)
    const [currentPreset, setCurrentPreset] = useMMKVObject<SamplerPreset>(Global.PresetData)
    const [presetList, setPresetList] = useState<PresetLabel[]>([])
    const [showNewPreset, setShowNewPreset] = useState<boolean>(false)

    const loadPresetList = (name: string = '') => {
        Presets.getFileList().then((list) => {
            const cleanlist = list.map((item) => {
                return item.replace(`.json`, '')
            })
            const mainlist: any = cleanlist.map((item) => {
                return { label: item }
            })
            setPresetList(mainlist)
            // after deletion, preset may not exist and needs to be changed
            if (cleanlist.includes(name)) return
            setPresetName(cleanlist[0])
            Presets.loadFile(cleanlist[0]).then((text) => setCurrentPreset(JSON.parse(text)))
        })
    }

    useEffect(() => {
        loadPresetList(presetName ?? '')
    }, [])

    // TODO: Figure this out
    const [legacy, setLegacy] = useMMKVBoolean(AppSettings.UseLegacyAPI)
    const apiValues = APIStateNew.useAPIState((state) => state.values)

    const samplerList =
        appMode === AppMode.LOCAL
            ? APIState[API.LOCAL].samplers
            : legacy
              ? APIState[APIType as API].samplers
              : // This is bad
                (defaultTemplates.filter(
                    (item) => item.name === apiValues.filter((item) => item.active)[0].configName
                )[0].request.samplerFields ?? [])

    return (
        <FadeDownView style={{ flex: 1 }}>
            <SafeAreaView>
                <TextBoxModal
                    booleans={[showNewPreset, setShowNewPreset]}
                    onConfirm={(text: string) => {
                        if (text === '') {
                            Logger.log(`Preset name cannot be empty`, true)
                            return
                        }

                        for (const item of presetList)
                            if (item.label === text) {
                                Logger.log(`Preset name already exists.`, true)
                                return
                            }
                        if (currentPreset)
                            Presets.saveFile(text, currentPreset).then(() => {
                                Logger.log(`Preset created.`, true)
                                loadPresetList(text)
                                setPresetName((currentPreset) => text)
                            })
                    }}
                />

                <Stack.Screen
                    options={{
                        animation: 'fade',
                        title: `Samplers`,
                    }}
                />

                <View style={styles.dropdownContainer}>
                    <Dropdown
                        value={presetName}
                        data={presetList}
                        valueField="label"
                        labelField="label"
                        onChange={(item) => {
                            if (item.label === presetName) return
                            setPresetName(item.label)
                            Presets.loadFile(item.label).then((preset) => {
                                setCurrentPreset(JSON.parse(preset))
                            })
                        }}
                        {...Style.drawer.default}
                    />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            if (presetName && currentPreset)
                                Presets.saveFile(presetName, currentPreset).then(() =>
                                    Logger.log(`Preset Updated!`, true)
                                )
                        }}>
                        <FontAwesome
                            size={24}
                            name="save"
                            color={Style.getColor('primary-text1')}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            if (presetList.length === 1) {
                                Logger.log(`Cannot Delete Last Preset.`, true)
                                return
                            }

                            Alert.alert({
                                title: `Delete Preset`,
                                description: `Are you sure you want to delete '${presetName}'?`,
                                buttons: [
                                    { label: 'Cancel' },
                                    {
                                        label: 'Delete Preset',
                                        onPress: async () => {
                                            presetName &&
                                                Presets.deleteFile(presetName).then(() => {
                                                    loadPresetList()
                                                })
                                        },
                                        type: 'warning',
                                    },
                                ],
                            })
                        }}>
                        <FontAwesome
                            size={24}
                            name="trash"
                            color={Style.getColor('primary-text1')}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            Presets.uploadFile().then((name) => {
                                if (name === undefined) {
                                    return
                                }
                                Presets.loadFile(name).then((preset) => {
                                    setCurrentPreset(JSON.parse(preset))
                                    setPresetName(name)
                                    loadPresetList(name)
                                })
                            })
                        }}>
                        <FontAwesome
                            size={24}
                            name="upload"
                            color={Style.getColor('primary-text1')}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={async () => {
                            saveStringExternal(`${presetName}.json`, JSON.stringify(currentPreset))
                        }}>
                        <FontAwesome
                            size={24}
                            name="download"
                            color={Style.getColor('primary-text1')}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            setShowNewPreset(true)
                        }}>
                        <FontAwesome
                            size={24}
                            name="plus"
                            color={Style.getColor('primary-text1')}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView>
                    <View style={styles.mainContainer}>
                        {samplerList?.map((item, index) => {
                            const samplerItem = Samplers[item.samplerID]
                            switch (samplerItem.inputType) {
                                case 'slider':
                                    return (
                                        (samplerItem.values.type === 'float' ||
                                            samplerItem.values.type === 'integer') && (
                                            <SliderItem
                                                key={item.samplerID}
                                                varname={samplerItem.internalID}
                                                body={currentPreset}
                                                setValue={setCurrentPreset}
                                                name={samplerItem.friendlyName}
                                                min={samplerItem.values.min}
                                                max={samplerItem.values.max}
                                                step={samplerItem.values.step}
                                                precision={samplerItem.values.precision ?? 2}
                                            />
                                        )
                                    )
                                case 'checkbox':
                                    return (
                                        <CheckboxTitle
                                            key={item.samplerID}
                                            varname={samplerItem.internalID}
                                            body={currentPreset}
                                            setValue={setCurrentPreset}
                                            name={samplerItem.friendlyName}
                                        />
                                    )
                                case 'textinput':
                                    return (
                                        <TextBox
                                            key={item.samplerID}
                                            varname={samplerItem.internalID}
                                            body={currentPreset}
                                            setValue={setCurrentPreset}
                                            name={samplerItem.friendlyName}
                                        />
                                    )
                                //case 'custom':
                                default:
                                    return (
                                        <Text style={styles.warningText}>
                                            Invalid Sampler Field!
                                        </Text>
                                    )
                            }
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </FadeDownView>
    )
}

export default SamplerMenu

const styles = StyleSheet.create({
    mainContainer: {
        margin: 16,
        paddingBottom: 150,
    },

    dropdownContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        flexDirection: 'row',
        paddingBottom: 12,
        alignItems: 'center',
    },

    selected: {
        color: Style.getColor('primary-text1'),
    },

    button: {
        padding: 5,
        borderRadius: 4,
        marginLeft: 8,
    },

    input: {
        color: Style.getColor('primary-text1'),
        backgroundColor: Style.getColor('primary-surface1'),
        borderColor: Style.getColor('primary-surface4'),
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginVertical: 8,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    warningText: {
        color: Style.getColor('primary-text1'),
        backgroundColor: Style.getColor('destructive-brand'),
        padding: 8,
        margin: 16,
        borderRadius: 8,
    },
})
