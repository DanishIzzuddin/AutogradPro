# backend/topology.py

import re
import ipaddress

def parse_router_subnets(config_text: str):
    """
    Return a list of IPv4Network for every 'ip address' in each interface block.
    """
    nets = []
    for m in re.finditer(
        r'interface\s+\S+(.*?)(?=^interface|\Z)',
        config_text, re.MULTILINE | re.DOTALL
    ):
        block = m.group(1)
        mm = re.search(
            r'ip\s+address\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)',
            block, re.IGNORECASE
        )
        if not mm:
            continue
        ip, mask = mm.groups()
        try:
            nets.append(ipaddress.IPv4Network(f"{ip}/{mask}", strict=False))
        except ValueError:
            pass
    return nets

def build_edges(router_nets: dict):
    """
    From {router: [IPv4Network,...]} build {(r1,r2): 'A.B.C.D/p'} edges.
    """
    edges = {}
    names = list(router_nets)
    for i in range(len(names)):
        for j in range(i+1, len(names)):
            r1, r2 = names[i], names[j]
            shared = set(router_nets[r1]) & set(router_nets[r2])
            for net in shared:
                edge = tuple(sorted((r1, r2)))
                edges[edge] = str(net)
    return edges
