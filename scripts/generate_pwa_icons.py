import struct
import zlib
import os

def create_png(width, height, draw_func):
    """Creates a raw RGBA PNG file."""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte: 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend((r, g, b, a))

    def chunk(chunk_type, data):
        return (
            struct.pack(">I", len(data))
            + chunk_type
            + data
            + struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        )

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(raw_data), 9))
    iend = chunk(b"IEND", b"")

    return header + ihdr + idat + iend

def cjk_scribe_icon(x, y, w, h, is_maskable=False):
    # Normalized coordinates 0.0 to 1.0
    nx = x / float(w)
    ny = y / float(h)
    
    # Distance from center
    cx, cy = 0.5, 0.5
    dx = nx - cx
    dy = ny - cy
    
    # Background: dark slate / ink wash (#1c1917 to #292524)
    # If maskable, fill edge-to-edge
    corner_radius = 0.22 if not is_maskable else 0.0
    
    # Check rounded rect bounds for non-maskable
    if not is_maskable:
        # Check corner clipping
        qx = abs(dx) - (0.5 - corner_radius)
        qy = abs(dy) - (0.5 - corner_radius)
        if qx > 0 and qy > 0 and (qx * qx + qy * qy) > (corner_radius * corner_radius):
            return (0, 0, 0, 0) # transparent outer corner
            
    # Base background gradient
    bg_factor = (nx + ny) * 0.5
    bg_r = int(28 + bg_factor * 12)
    bg_g = int(25 + bg_factor * 10)
    bg_b = int(23 + bg_factor * 8)
    
    # Seal box in the center: size ~ 0.54
    seal_half = 0.27
    if abs(dx) <= seal_half and abs(dy) <= seal_half:
        # Inside the seal
        # Border of seal: gold / white highlight
        border_thickness = 0.02
        if (abs(dx) >= seal_half - border_thickness or abs(dy) >= seal_half - border_thickness):
            return (254, 240, 138, 255) # Light warm gold border
        
        # Calligraphic character inside seal: 書 (vertical / horizontal lines)
        # Vertical stroke
        if abs(dx) <= 0.025 and -0.18 <= dy <= 0.18:
            return (255, 255, 255, 255)
        # Top bar
        if abs(dx) <= 0.16 and -0.19 <= dy <= -0.14:
            return (255, 255, 255, 255)
        # Middle bars
        if abs(dx) <= 0.13 and -0.09 <= dy <= -0.06:
            return (255, 255, 255, 255)
        if abs(dx) <= 0.14 and -0.01 <= dy <= 0.02:
            return (255, 255, 255, 255)
        # Lower box (Sun/Day component 日)
        if abs(dx) <= 0.12 and 0.07 <= dy <= 0.20:
            # Box borders
            if abs(dx) >= 0.09 or dy <= 0.09 or dy >= 0.18 or abs(dy - 0.135) <= 0.012:
                return (255, 255, 255, 255)
            # Box inside (seal red)
            return (185, 43, 39, 255)

        # Seal background (Traditional Cinnabar Red / 朱砂红 #b92b27 to #991b1b)
        seal_grad = (dy + seal_half) / (2 * seal_half)
        sr = int(185 - seal_grad * 35)
        sg = int(43 - seal_grad * 16)
        sb = int(39 - seal_grad * 12)
        return (sr, sg, sb, 255)

    # Accent decorative gold dot (calligraphy drop)
    drop_dx = nx - 0.77
    drop_dy = ny - 0.26
    if drop_dx * drop_dx + drop_dy * drop_dy <= 0.028 * 0.028:
        return (251, 191, 36, 255)

    return (bg_r, bg_g, bg_b, 255)

os.makedirs('public', exist_ok=True)

# 192x192
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(create_png(192, 192, lambda x, y, w, h: cjk_scribe_icon(x, y, w, h, False)))

# 512x512
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, lambda x, y, w, h: cjk_scribe_icon(x, y, w, h, False)))

# 512x512 maskable (full bleed safe-zone padding)
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, lambda x, y, w, h: cjk_scribe_icon(x, y, w, h, True)))

# 180x180 apple-touch-icon
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(create_png(180, 180, lambda x, y, w, h: cjk_scribe_icon(x, y, w, h, False)))

# 32x32 favicon.ico (PNG format inside .ico or standard browser png favicon)
with open('public/favicon.ico', 'wb') as f:
    f.write(create_png(32, 32, lambda x, y, w, h: cjk_scribe_icon(x, y, w, h, False)))

print("PWA icons generated successfully!")
