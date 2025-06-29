import zipfile, os

def load_configs_from_zip(zip_path):
    cfgs = {}
    has_txt_file = False

    with zipfile.ZipFile(zip_path, 'r') as z:
        for entry in z.namelist():
            name = os.path.basename(entry)
            if name.lower().endswith('.txt'):
                has_txt_file = True
                text = z.read(entry).decode('utf-8', errors='ignore')
                cfgs[name] = text

    if not has_txt_file:
        raise ValueError("No .txt files found in submitted ZIP. Please upload a valid configuration ZIP.")

    return cfgs
