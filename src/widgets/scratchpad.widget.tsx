import {hanzoNative} from 'lib/HanzoNative'
import {observer} from 'mobx-react-lite'
import {FC, useEffect} from 'react'
import {TextInput, View} from 'react-native'
import {useStore} from 'store'
import colors from 'tailwindcss/colors'

export const ScratchpadWidget: FC = observer(() => {
  let store = useStore()

  useEffect(() => {
    hanzoNative.turnOffVerticalArrowsListeners()
    hanzoNative.turnOffEnterListener()
    return () => {
      hanzoNative.turnOnEnterListener()
      hanzoNative.turnOnVerticalArrowsListeners()
    }
  }, [])

  return (
    <View className="flex-1">
      <TextInput
        autoFocus
        value={store.ui.note}
        onChangeText={store.ui.setNote}
        // @ts-expect-error
        enableFocusRing={false}
        placeholderTextColor={colors.neutral[400]}
        placeholder="Write something..."
        className="flex-1 p-4 -mt-8"
        multiline
      />
    </View>
  )
})
