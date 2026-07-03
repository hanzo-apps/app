// Create the Gui config before any component import (Gui reads it at module
// load). Then register the shared launcher as the native root component.
import '@hanzo/launcher/gui.config'

import { registerRootComponent } from 'expo'

import App from './App'

registerRootComponent(App)
