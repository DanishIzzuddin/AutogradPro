import zipfile, os

def load_configs_from_zip(zip_path):
    cfgs = {}
    with zipfile.ZipFile(zip_path, 'r') as z:
        for entry in z.namelist():
            name = os.path.basename(entry)
            if name.lower().endswith('.txt'):
                text = z.read(entry).decode('utf-8', errors='ignore')
                cfgs[name] = text
    return cfgs
