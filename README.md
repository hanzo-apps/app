# Hanzo App

![Header](Header.png)

<br/>
<div align="center">
  <a align="center" href="https://twitter.com/ospfranco">
    <img src="https://img.shields.io/twitter/follow/ospfranco?label=Follow%20%40ospfranco&style=social" />
  </a>
  <br/>
  <br/>
  <a align="center" href="https://hanzo.app" target="_blank">Visit Hanzo App</a>
</div>

Hanzo App is an AI-powered command palette and local AI assistant for macOS. It merges the best of Sol's powerful app launcher capabilities with Jan's advanced local AI features, creating the ultimate productivity tool. Access Hanzo AI instantly with the Tab key.

Copyright © 2025 Hanzo Industries Inc

[Visit official site](https://hanzo.app)

## Download

Install via brew

```
brew install --cask hanzo
```

Or manually download the latest [release](https://github.com/hanzoai/app/releases).

## Discord

Join the Discord

https://discord.gg/W9XmqCQCKP

## Features

### AI Assistant (Hanzo Zen)
- Press Tab to instantly access AI chat from anywhere
- Powered by the Zen model
- Context-aware assistance
- Code generation and debugging
- Natural language to action

### Productivity Tools
- App search and launch
- Custom shortcuts
- Google translate
- Calendar integration
- Show upcoming appointment in Menu Bar
- Custom AppleScript commands
- Custom links
- Browser bookmarks import
- Window Manager
- Emoji picker
- Clipboard manager
- Notes Scratchpad

### Utilities
- Retrieve Wi-Fi password
- Show IP address
- Start a Google Meet
- Switch OS theme
- Process killer
- Clear XCode Derived Data
- Generate NanoID/UUID
- Generate lorem ipsum
- Format and paste JSON
- Forward media keys to Spotify/Apple Music
- Blacken Menu Bar
- Quickly evaluate math operations

## Contributing

You need to set up your machine for macOS development with React Native. Basically you need to install:

- Mise (https://mise.jdx.dev/)
- Xcode
- Cocoapods

Follow any of the online tutorials to set up your machine for iOS/MacOS React Native development.

Once you have everything installed run the following commands

```sh
mise plugin add cocoapods
# To enable hooks
mise settings experimental=true
# Will install all bun, ruby and run the installation of dependencies
mise install

# You can then run the app with
bun macos
```

## License

MIT License
