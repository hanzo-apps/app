#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw
import cairosvg
import io

# Simplified SVG for tray icon (just the H)
tray_svg = '''<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg">
<path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff"/>
<path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff"/>
<path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff"/>
<path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff"/>
<path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff"/>
</svg>'''

# Create icons directory if it doesn't exist
icons_dir = os.path.join(os.path.dirname(__file__), '..', 'src-tauri', 'icons')

# Create tray icons (16x16 and 32x32 for retina) with padding
for size in [16, 32]:
    # Add 1px padding on each side, so render the H smaller
    h_size = size - 2
    
    # Convert SVG to PNG at smaller size
    png_data = cairosvg.svg2png(bytestring=tray_svg.encode('utf-8'), 
                                output_width=h_size, 
                                output_height=h_size)
    h_img = Image.open(io.BytesIO(png_data))
    
    # Convert to RGBA if not already
    if h_img.mode != 'RGBA':
        h_img = h_img.convert('RGBA')
    
    # Create a new image with padding
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # Paste the H logo centered (1px padding on each side)
    img.paste(h_img, (1, 1), h_img)
    
    # Save the icon
    if size == 16:
        filename = 'tray-icon.png'
    else:
        filename = 'tray-icon@2x.png'
    
    filepath = os.path.join(icons_dir, filename)
    img.save(filepath, 'PNG')
    print(f"Created {filename}")

print("Tray icons created!")