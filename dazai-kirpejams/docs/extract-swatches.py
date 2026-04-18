"""Iskirpiame visus 46 Color SHOCK swatch'us is PDF originalios raiskos."""
import fitz
import os
from pathlib import Path

PDF = 'docs/color-shock-chart.pdf'
OUT = Path('public/colors')
OUT.mkdir(parents=True, exist_ok=True)

# Mapping pagal poziciju tvarka (sort by row y, then x) - zr. analizes output
# Row 1 (y~138-200): NATURAL(9) + ASH(6) + ICY_CHOCOLATE(1) + GOLDEN(1) = 17
# Row 2 (y~260-322): ASH_PEARL(3) + VIOLET(1) + VIOLET_GOLD(1) + WARM_BEIGE(5) + COPPER(2) + MAHOGANY(1) + RED(2) + CHOCOLATE(2) = 17
# Row 3 (y~383-445): SUPERLIFT(6)
# Row 4 (y~505-567): TONER_CORRECTORS(6)

CODES = [
    # Row 1 - NATURAL
    ('1.00', 'natural'),
    ('3.00', 'natural'),
    ('4.00', 'natural'),
    ('5.00', 'natural'),
    ('6.00', 'natural'),
    ('7.00', 'natural'),
    ('8.00', 'natural'),
    ('9.00', 'natural'),
    ('10.00', 'natural'),
    # Row 1 - ASH
    ('5.1', 'ash'),
    ('6.1', 'ash'),
    ('7.1', 'ash'),
    ('8.1', 'ash'),
    ('9.1', 'ash'),
    ('10.1', 'ash'),
    # Row 1 - ICY CHOCOLATE
    ('7.18', 'icy-chocolate'),
    # Row 1 - GOLDEN
    ('9.3', 'golden'),
    # Row 2 - ASH PEARL
    ('7.12', 'ash-pearl'),
    ('8.12', 'ash-pearl'),
    ('9.12', 'ash-pearl'),
    # Row 2 - VIOLET
    ('5.22', 'violet'),
    # Row 2 - VIOLET GOLD
    ('4.23', 'violet-gold'),
    # Row 2 - WARM BEIGE
    ('6.32', 'warm-beige'),
    ('7.32', 'warm-beige'),
    ('8.32', 'warm-beige'),
    ('9.32', 'warm-beige'),
    ('10.32', 'warm-beige'),
    # Row 2 - COPPER
    ('7.444', 'copper'),
    ('8.444', 'copper'),
    # Row 2 - MAHOGANY
    ('6.5', 'mahogany'),
    # Row 2 - RED
    ('6.66', 'red'),
    ('7.66', 'red'),
    # Row 2 - CHOCOLATE
    ('5.8', 'chocolate'),
    ('6.8', 'chocolate'),
    # Row 3 - SUPERLIFT
    ('11.11', 'superlift'),
    ('12.0', 'superlift'),
    ('12.2', 'superlift'),
    ('12.12', 'superlift'),
    ('12.21', 'superlift'),
    ('12.62', 'superlift'),
    # Row 4 - TONER & CORRECTORS
    ('silver-grey', 'toner-correctors'),
    ('light-grey', 'toner-correctors'),
    ('dark-grey', 'toner-correctors'),
    ('silver-pearl', 'toner-correctors'),
    ('silver-beige', 'toner-correctors'),
    ('lilac', 'toner-correctors'),
]

doc = fitz.open(PDF)
page = doc[0]
image_list = page.get_image_info(xrefs=True)

# Imame tik tuos su xref > 0 (tikri vaizdai, ne tekstas)
swatches = [img for img in image_list if img['xref'] > 0]
# Sort by row then column
swatches.sort(key=lambda i: (round(i['bbox'][1] / 10) * 10, i['bbox'][0]))

print(f'Swatches found: {len(swatches)}')
print(f'Codes to map: {len(CODES)}')
assert len(swatches) == len(CODES), f'Mismatch: {len(swatches)} vs {len(CODES)}'

for idx, (swatch, (code, group)) in enumerate(zip(swatches, CODES)):
    xref = swatch['xref']
    # Extract raw image
    img_data = doc.extract_image(xref)
    ext = img_data['ext']
    raw_bytes = img_data['image']

    code_slug = code.replace('.', '-')
    filename_raw = OUT / f'color-shock-{code_slug}.{ext}'
    with open(filename_raw, 'wb') as f:
        f.write(raw_bytes)

    y = swatch['bbox'][1]
    x = swatch['bbox'][0]
    print(f'{idx:2d}: {code:15s} ({group:18s}) xref={xref:3d} pos=({x:.0f},{y:.0f}) -> {filename_raw.name} ({len(raw_bytes)} bytes, {img_data["width"]}x{img_data["height"]})')

print('\nDone.')
