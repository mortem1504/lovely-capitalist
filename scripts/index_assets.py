from pathlib import Path
from PIL import Image
import json
root=Path('.')
assets=[]
for folder in ['Interior Asset','Portrait_Generator']:
 for p in sorted(Path(folder).rglob('*.png')):
  with Image.open(p) as im:
   parts=p.stem.split('_'); assets.append(dict(path=str(p),width=im.width,height=im.height,alpha='A' in im.mode,category=p.parent.name,index=int(parts[-1]) if parts[-1].isdigit() else None,kind='portrait-sheet' if folder=='Portrait_Generator' else 'tileset' if 'Room_Builder' in p.name else 'furniture',frameWidth=32 if folder=='Portrait_Generator' else None,frameHeight=32 if folder=='Portrait_Generator' else None))
with Image.open('Modern_UI_Style_1.png') as im: assets.append(dict(path='Modern_UI_Style_1.png',width=im.width,height=im.height,alpha=True,kind='ui-atlas'))
Path('src/game/data/assets.json').write_text(json.dumps(assets,separators=(',',':')))
Path('manifest.json').write_text(json.dumps(dict(version=1,assets=len(assets),registry='src/game/data/assets.json',portrait=dict(frame=[32,32],grid=[10,3],layerOrder=['Skins','Eyes','Hairstyles','Accessories']),notes='Numbered furniture filenames do not encode semantics or direction. Gameplay mappings visually verified; originals untouched.'),indent=2))
print('Indexed',len(assets),'original PNGs')
# Ship only metadata referenced by the curated catalog plus compatible portraits.
# The full discovery index remains available for content authoring.
import re
source=Path('src/game/data/catalog.js').read_text()
aliases={'kitchen':('12_Kitchen_Singles','Kitchen'),'bath':('3_Bathroom_Singles','Bathroom'),'basement':('14_Basement_Singles','Basement'),'living':('2_Living_Room_Singles','Living_Room')}
used=set()
for alias,number in re.findall(r'\b(kitchen|bath|basement|living)\((\d+)\)',source):
 folder,name=aliases[alias];used.add(f'Interior Asset/All furniture/{folder}/{name}_Singles_{number}.png')
runtime=[{k:a[k] for k in ['path','width','height']} for a in assets if a['path'] in used or a['kind']=='portrait-sheet']
Path('src/game/data/runtime-assets.json').write_text(json.dumps(runtime,separators=(',',':')))
print('Runtime metadata:',len(runtime),'assets; full index retained for authoring')
