import {observer} from 'mobx-react-lite'
import {View, Text, TouchableOpacity, TextInput} from 'react-native-web'
import {useStore} from '@/stores/StoreProvider'
import {useState} from 'react'

export const Appearance = observer(() => {
  const store = useStore()
  const [customPrimary, setCustomPrimary] = useState(store.ui.customColors.primary)
  const [customSecondary, setCustomSecondary] = useState(store.ui.customColors.secondary)
  const [customAccent, setCustomAccent] = useState(store.ui.customColors.accent)
  
  const fontOptions = [
    { label: 'System Default', value: 'system' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'SF Pro', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Monaco', value: 'Monaco, monospace' },
    { label: 'hanzoai', value: 'hanzoai, monospace' },
    { label: 'Consolas', value: 'Consolas, monospace' },
  ]

  return (
    <View className="p-8 gap-8">
      {/* Theme Section */}
      <View className="gap-4">
        <Text className="text-lg font-semibold text">Theme</Text>
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => store.ui.setTheme('system')}
            className="flex-row items-center gap-3"
          >
            <input
              type="radio"
              name="theme"
              checked={store.ui.theme === 'system'}
              onChange={() => {}}
              className="radio-gradient"
            />
            <Text className="text">Follow system</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => store.ui.setTheme('light')}
            className="flex-row items-center gap-3"
          >
            <input
              type="radio"
              name="theme"
              checked={store.ui.theme === 'light'}
              onChange={() => {}}
              className="radio-gradient"
            />
            <Text className="text">Light</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => store.ui.setTheme('dark')}
            className="flex-row items-center gap-3"
          >
            <input
              type="radio"
              name="theme"
              checked={store.ui.theme === 'dark'}
              onChange={() => {}}
              className="radio-gradient"
            />
            <Text className="text">Dark</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Font Settings */}
      <View className="gap-4">
        <Text className="text-lg font-semibold text">Font</Text>
        
        <View className="gap-2">
          <Text className="text-sm darker-text">Font Family</Text>
          <select
            value={store.ui.fontFamily}
            onChange={(e) => store.ui.setFontFamily(e.target.value)}
            className="form-control w-full"
          >
            {fontOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </View>
        
        <View className="gap-2">
          <Text className="text-sm darker-text">Font Size</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => store.ui.setFontSize(Math.max(10, store.ui.fontSize - 1))}
              className="btn-glass px-4 py-2"
            >
              <Text className="text font-semibold">-</Text>
            </TouchableOpacity>
            
            <View className="slider-track w-32 mx-4">
              <View className="slider-fill" style={{width: `${((store.ui.fontSize - 10) / 14) * 100}%`}}>
              </View>
              <View className="slider-thumb absolute" style={{left: `${((store.ui.fontSize - 10) / 14) * 100}%`, top: '-7px'}} />
            </View>
            
            <Text className="text w-16 text-center font-semibold">{store.ui.fontSize}px</Text>
            
            <TouchableOpacity
              onPress={() => store.ui.setFontSize(Math.min(24, store.ui.fontSize + 1))}
              className="btn-glass px-4 py-2"
            >
              <Text className="text font-semibold">+</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => store.ui.setFontSize(14)}
              className="btn-gradient px-4 py-2 ml-4"
            >
              <Text className="text-white font-semibold">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Color Scheme */}
      <View className="gap-4">
        <Text className="text-lg font-semibold text">Color Scheme</Text>
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => store.ui.setColorScheme('monochrome')}
            className="flex-row items-center gap-3"
          >
            <input
              type="radio"
              name="colorScheme"
              checked={store.ui.colorScheme === 'monochrome'}
              onChange={() => {}}
              className="radio-gradient"
            />
            <Text className="text">Monochrome (Default)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => store.ui.setColorScheme('custom')}
            className="flex-row items-center gap-3"
          >
            <input
              type="radio"
              name="colorScheme"
              checked={store.ui.colorScheme === 'custom'}
              onChange={() => {}}
              className="radio-gradient"
            />
            <Text className="text">Custom Colors</Text>
          </TouchableOpacity>
        </View>
        
        {store.ui.colorScheme === 'custom' && (
          <View className="card-glass p-6 gap-4 mt-4">
            <View className="gap-2">
              <Text className="text-sm darker-text font-medium">Primary Color</Text>
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={customPrimary}
                  onChangeText={setCustomPrimary}
                  onBlur={() => store.ui.setCustomColors({ primary: customPrimary })}
                  className="flex-1 form-control"
                  placeholder="#000000"
                />
                <View 
                  className="w-12 h-12 rounded-lg shadow-lg"
                  style={{ backgroundColor: customPrimary }}
                />
              </View>
            </View>
            
            <View className="gap-2">
              <Text className="text-sm darker-text font-medium">Secondary Color</Text>
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={customSecondary}
                  onChangeText={setCustomSecondary}
                  onBlur={() => store.ui.setCustomColors({ secondary: customSecondary })}
                  className="flex-1 form-control"
                  placeholder="#333333"
                />
                <View 
                  className="w-12 h-12 rounded-lg shadow-lg"
                  style={{ backgroundColor: customSecondary }}
                />
              </View>
            </View>
            
            <View className="gap-2">
              <Text className="text-sm darker-text font-medium">Accent Color</Text>
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={customAccent}
                  onChangeText={setCustomAccent}
                  onBlur={() => store.ui.setCustomColors({ accent: customAccent })}
                  className="flex-1 form-control"
                  placeholder="#0066cc"
                />
                <View 
                  className="w-12 h-12 rounded-lg shadow-lg"
                  style={{ backgroundColor: customAccent }}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Preview */}
      <View className="gap-4">
        <Text className="text-lg font-semibold text">Preview</Text>
        <View className="vibrancy-gradient p-6 settings-content">
          <Text className="title-gradient text-2xl mb-3">Sample Heading</Text>
          <Text className="text mb-2">This is how your text will appear with the current settings.</Text>
          <Text className="darker-text mb-4">Experience the beautiful Hanzo design system with glass morphism effects and smooth animations.</Text>
          
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity className="btn-primary">
              <Text className="text-white">Primary</Text>
            </TouchableOpacity>
            <TouchableOpacity className="btn-gradient">
              <Text className="text-white">Gradient</Text>
            </TouchableOpacity>
            <TouchableOpacity className="btn-glass">
              <Text className="text">Glass</Text>
            </TouchableOpacity>
          </View>
          
          <View className="mt-6 ai-model-badge inline-flex">
            <View className="ai-status-indicator mr-2" />
            <Text className="text-sm">AI Ready</Text>
          </View>
        </View>
      </View>
    </View>
  )
})