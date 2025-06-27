# backend/normalizer/normalizer.py

import re

def normalize_ips(config_text: str, master_prefix: str) -> str:
    """
    Rewrite any 2MM.DD.LL.ZZZ into master_prefix.LL.ZZZ.
    """
    pattern = re.compile(r'\b2\d{2}\.\d{2}\.(\d+\.\d+)\b')
    return pattern.sub(lambda m: f"{master_prefix}.{m.group(1)}", config_text)
