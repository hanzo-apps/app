#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'macos/hanzo.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Disable code signing for all targets
project.targets.each do |target|
  target.build_configurations.each do |config|
    config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
    config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
    config.build_settings['CODE_SIGN_IDENTITY'] = ''
    config.build_settings['CODE_SIGN_ENTITLEMENTS'] = ''
    config.build_settings['DEVELOPMENT_TEAM'] = ''
    config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = ''
    config.build_settings['ENABLE_HARDENED_RUNTIME'] = 'NO'
    config.build_settings['OTHER_CODE_SIGN_FLAGS'] = '--deep'
    config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.hanzo.app'
  end
end

project.save

puts "Code signing disabled for all targets"