#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw
import cairosvg
import io

# SVG content for Hanzo logo
svg_content = '''<svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg">
<rect width="67" height="67" fill="#000000"/>
<path d="M22.21 67V44.6369H0V67H22.21Z" fill="#ffffff"/>
<path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill="#DDDDDD"/>
<path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="#ffffff"/>
<path d="M22.21 0H0V22.3184H22.21V0Z" fill="#ffffff"/>
<path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="#ffffff"/>
<path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill="#DDDDDD"/>
<path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="#ffffff"/>
</svg>'''

# Icon sizes needed for macOS
sizes = [
    (16, 16),
    (32, 32),
    (64, 64),
    (128, 128),
    (256, 256),
    (512, 512),
    (1024, 1024)
]

# Create icons directory if it doesn't exist
icons_dir = os.path.join(os.path.dirname(__file__), '..', 'src-tauri', 'icons')
os.makedirs(icons_dir, exist_ok=True)

# Function to create rounded icon
def create_rounded_icon(size):
    # Create a square image with black background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Convert SVG to PNG at the right size
    png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'), 
                                output_width=size, 
                                output_height=size)
    logo_img = Image.open(io.BytesIO(png_data))
    
    # Create rounded corners mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # Radius for rounded corners (about 17.5% of size for macOS style)
    radius = int(size * 0.175)
    
    # Draw rounded rectangle
    draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=255)
    
    # Apply mask to create rounded corners
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(logo_img, (0, 0))
    output.putalpha(mask)
    
    # Composite on black background
    final = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    final.paste(output, (0, 0), output)
    
    return final

# Generate all icon sizes
print("Creating Hanzo app icons...")

for width, height in sizes:
    icon = create_rounded_icon(width)
    
    # Save standard size
    filename = f"icon_{width}x{height}.png"
    filepath = os.path.join(icons_dir, filename)
    icon.save(filepath, 'PNG')
    print(f"Created {filename}")
    
    # Save @2x version for Retina displays
    if width <= 512:
        icon_2x = create_rounded_icon(width * 2)
        filename_2x = f"icon_{width}x{height}@2x.png"
        filepath_2x = os.path.join(icons_dir, filename_2x)
        icon_2x.save(filepath_2x, 'PNG')
        print(f"Created {filename_2x}")

# Also save specific sizes Tauri expects
standard_sizes = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "icon.png": 1024
}

for filename, size in standard_sizes.items():
    icon = create_rounded_icon(size)
    filepath = os.path.join(icons_dir, filename)
    icon.save(filepath, 'PNG')
    print(f"Created {filename}")

print("\nIcon creation complete!")
print("\nNext step: Run 'python3 scripts/create_icns.py' to create the .icns file")