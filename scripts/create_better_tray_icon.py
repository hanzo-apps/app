#!/usr/bin/env python3

import cairosvg
from PIL import Image, ImageDraw
import io
import os

# Hanzo SVG with white H on transparent background
hanzo_svg = '''<svg viewBox="0 0 67 67" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_7420_24623)">
<path d="M0 20.6974V0H20.6974V20.6974H0Z" fill="white"/>
<path d="M46.3026 20.6974V0H67V20.6974H46.3026Z" fill="white"/>
<path d="M0 66.6447V45.9474H20.6974V66.6447H0Z" fill="white"/>
<path d="M46.3026 66.6447V45.9474H67V66.6447H46.3026Z" fill="white"/>
<path d="M0 45.8553V20.7895H67V45.8553H0Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_7420_24623">
<rect width="67" height="66.6447" fill="white"/>
</clipPath>
</defs>
</svg>'''

def create_tray_icon():
    # Convert SVG to PNG at a larger size for clarity
    png_data = cairosvg.svg2png(bytestring=hanzo_svg.encode('utf-8'), output_width=64, output_height=64)
    svg_image = Image.open(io.BytesIO(png_data))
    
    # Create tray icons at different sizes
    # macOS recommends 22x22 for regular displays and 44x44 for retina (@2x)
    sizes = [
        (22, 'tray-icon.png'),  # Regular
        (44, 'tray-icon@2x.png'),  # Retina
    ]
    
    for size, filename in sizes:
        # Create a new transparent image
        tray_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # Resize the SVG image to fit, maintaining aspect ratio
        resized = svg_image.resize((size, size), Image.Resampling.LANCZOS)
        
        # Paste the resized image
        tray_icon.paste(resized, (0, 0), resized)
        
        # Save the icon
        output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src-tauri', 'icons', filename)
        tray_icon.save(output_path, 'PNG')
        print(f"Created {output_path}")

if __name__ == "__main__":
    create_tray_icon()