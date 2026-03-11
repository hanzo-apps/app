#!/usr/bin/env python3
import os
import subprocess
import tempfile
import shutil

# Path to icons directory
script_dir = os.path.dirname(__file__)
icons_dir = os.path.join(script_dir, '..', 'src-tauri', 'icons')

# Create iconset directory
with tempfile.TemporaryDirectory() as temp_dir:
    iconset_dir = os.path.join(temp_dir, 'icon.iconset')
    os.makedirs(iconset_dir)
    
    # Icon sizes for macOS .icns
    icon_sizes = [
        ('icon_16x16.png', 'icon_16x16.png'),
        ('icon_16x16@2x.png', 'icon_32x32.png'),
        ('icon_32x32.png', 'icon_32x32.png'),
        ('icon_32x32@2x.png', 'icon_64x64.png'),
        ('icon_128x128.png', 'icon_128x128.png'),
        ('icon_128x128@2x.png', 'icon_256x256.png'),
        ('icon_256x256.png', 'icon_256x256.png'),
        ('icon_256x256@2x.png', 'icon_512x512.png'),
        ('icon_512x512.png', 'icon_512x512.png'),
        ('icon_512x512@2x.png', 'icon_1024x1024.png'),
    ]
    
    # Copy icons to iconset with proper names
    for dest_name, source_file in icon_sizes:
        source_path = os.path.join(icons_dir, source_file)
        dest_path = os.path.join(iconset_dir, dest_name)
        
        if os.path.exists(source_path):
            shutil.copy(source_path, dest_path)
            print(f"Copied {source_file} to {dest_name}")
        else:
            print(f"Warning: {source_file} not found")
    
    # Create .icns file using iconutil
    icns_path = os.path.join(icons_dir, 'icon.icns')
    try:
        subprocess.run(['iconutil', '-c', 'icns', iconset_dir, '-o', icns_path], check=True)
        print(f"\nSuccessfully created icon.icns at {icns_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error creating .icns file: {e}")
    except FileNotFoundError:
        print("Error: iconutil not found. Make sure you're running this on macOS.")