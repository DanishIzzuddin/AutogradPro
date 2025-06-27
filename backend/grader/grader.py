# backend/grader/grader.py

import re
import os
import sys
import ipaddress
from collections import Counter, deque

# ─── PATCH: add project root so `import backend.xxx` works ──────────────
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..')
)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
# ─────────────────────────────────────────────────────────────────────────

from backend.extractor.extractor import load_configs_from_zip
from backend.normalizer.normalizer import normalize_ips
from backend.topology import parse_router_subnets, build_edges

# --- DEDUCTION CONSTANTS ---
HOSTNAME_DEDUCTION              = 5
STATIC_MISSING_DEDUCTION_CAP    = 50
STATIC_NEXT_HOP_CREDIT          = 0.75
STATIC_MASK_CREDIT              = 0.50
MASK_DEDUCTION_PER_IFACE        = 5
STATIC_DUPLICATE_DEDUCTION      = 2
OSPF_MISSING_DEDUCTION_PER_NET  = 20
OSPF_EXTRA_DEDUCTION_PER_NET    = 2
OSPF_MISSING_DEDUCTION_CAP      = 80
OSPF_EXTRA_DEDUCTION_CAP        = 10

# --- REGEX PATTERNS ---
FORMAT_PAT       = re.compile(r'\b2\d{2}\.\d{2}\.\d+\.\d+\b')
STATIC_ROUTE_PAT = re.compile(r'^\s*ip\s+route\s+.*$', re.IGNORECASE|re.MULTILINE)
OSPF_PATTERN     = re.compile(r'^\s*router\s+ospf\b', re.IGNORECASE|re.MULTILINE)

def sanitize_config(cfg: str) -> str:
    out = []
    for line in cfg.splitlines():
        s = line.strip()
        if not s or s.startswith('!') or s.startswith('#'):
            continue
        if '!' in line:
            line = line.split('!')[0]
        out.append(line)
    return '\n'.join(out)

def mask_to_cidr(mask: str) -> int:
    return sum(bin(int(o)).count('1') for o in mask.split('.'))

def get_hostname(cfg: str) -> str | None:
    m = re.search(r'^\s*hostname\s+(\S+)', cfg, re.MULTILINE|re.IGNORECASE)
    return m.group(1) if m else None

def parse_ospf_networks(cfg: str) -> set[str]:
    nets = set()
    for m in re.finditer(
        r'^\s*network\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+area\s+\d+',
        cfg, re.MULTILINE|re.IGNORECASE
    ):
        ip_str, wc_str = m.group(1), m.group(2)
        ip_i = int(ipaddress.IPv4Address(ip_str))
        wc_i = int(ipaddress.IPv4Address(wc_str))
        net_i = ip_i & (~wc_i & 0xFFFFFFFF)
        prefix = 32 - bin(wc_i).count('1')
        nets.add(str(ipaddress.IPv4Network((net_i, prefix))))
    return nets

def parse_ospf_neighbors(output: str) -> set[str]:
    neighs = set()
    for line in output.splitlines():
        line = line.strip()
        if not line or line.lower().startswith('neighbor id'):
            continue
        parts = re.split(r'\s+', line)
        if len(parts) >= 5 and re.fullmatch(r'\d+\.\d+\.\d+\.\d+', parts[4]):
            neighs.add(parts[4])
    return neighs

def all_reachable(edges: dict) -> bool:
    adj = {}
    for (a, b) in edges:
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)
    if not adj:
        return True
    seen = {next(iter(adj))}
    q = deque(seen)
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in seen:
                seen.add(v)
                q.append(v)
    return len(seen) == len(adj)

def grade_all(
    master_zip: str,
    student_zip: str,
    master_neigh_zip: str,
    student_neigh_zip: str,
    birthday_prefix: str,
    master_prefix: str = None
) -> dict:
    norm_prefix = master_prefix or birthday_prefix

    # 1) LOAD
    m_raw  = load_configs_from_zip(master_zip)
    s_raw  = load_configs_from_zip(student_zip)
    mn_raw = load_configs_from_zip(master_neigh_zip)
    sn_raw = load_configs_from_zip(student_neigh_zip)

    # 2) SANITIZE & NORMALIZE
    mcfgs   = {r: normalize_ips(sanitize_config(txt), norm_prefix) for r, txt in m_raw.items()}
    scfgs   = {r: normalize_ips(sanitize_config(txt), norm_prefix) for r, txt in s_raw.items()}
    m_neigh = {r: normalize_ips(sanitize_config(txt), norm_prefix) for r, txt in mn_raw.items()}
    s_neigh = {r: normalize_ips(sanitize_config(txt), norm_prefix) for r, txt in sn_raw.items()}

    # 3) DETECT ASSIGNMENT TYPE
    base = os.path.basename(master_zip).lower()
    static_global = any(STATIC_ROUTE_PAT.search(txt) for txt in mcfgs.values())
    ospf_global   = any(OSPF_PATTERN.search(txt)    for txt in mcfgs.values())

    if 'static' in base or static_global:
        assignment_type = 'static'
    elif 'ospf' in base or ospf_global:
        assignment_type = 'ospf'
    else:
        assignment_type = 'static'

    # 4) MASTER SUBNETS MAP
    master_nets_by_router = {r: parse_router_subnets(txt) for r, txt in mcfgs.items()}

    # 5) ROUTER→(NET→IP) MAP
    router_iface_map = {}
    for r, txt in mcfgs.items():
        router_iface_map[r] = {}
        for m in re.finditer(r'interface\s+\S+(.*?)(?=^interface|\Z)', txt, re.MULTILINE|re.DOTALL):
            block = m.group(1)
            mm = re.search(r'ip\s+address\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)', block, re.IGNORECASE)
            if not mm:
                continue
            ip, mask = mm.groups()
            net = ipaddress.IPv4Network(f"{ip}/{mask}", strict=False)
            router_iface_map[r][net] = ip

    # 6) MASTER EDGES & EXPECTED NEIGHBORS
    m_edges = build_edges(master_nets_by_router)
    expected_neighbors = {r: set() for r in mcfgs}
    for (r1, r2), net_str in m_edges.items():
        net = ipaddress.IPv4Network(net_str)
        ip1 = router_iface_map[r1].get(net)
        ip2 = router_iface_map[r2].get(net)
        if ip1 and ip2:
            expected_neighbors[r1].add(ip2)
            expected_neighbors[r2].add(ip1)

    per_router    = {}
    router_scores = []

    # 7) PER-ROUTER GRADING
    for rname, mtxt in mcfgs.items():
        stxt = scfgs.get(rname, '')
        score = 100.0

        static_fb, ospf_fb = [], []
        mask_fb, fmt_fb, hostname_fb = [], [], []

        # Mask & format checks
        iface_addrs = []
        for m in re.finditer(r'interface\s+\S+(.*?)(?=^interface|\Z)', stxt, re.MULTILINE|re.DOTALL):
            block = m.group(1)
            mm = re.search(r'ip\s+address\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)', block, re.IGNORECASE)
            if not mm:
                continue
            ip, mask = mm.groups()
            iface_addrs.append((ip, mask))
            if mask_to_cidr(mask) != 24:
                mask_fb.append(f"❌ Incorrect mask for {ip}: −{MASK_DEDUCTION_PER_IFACE} pts")
                score -= MASK_DEDUCTION_PER_IFACE

        ips_to_check = {ip for ip, _ in iface_addrs}
        for line in STATIC_ROUTE_PAT.findall(stxt):
            parts = line.split()
            if len(parts) >= 5:
                ips_to_check.add(parts[-1])
        errs = [ip for ip in ips_to_check if not FORMAT_PAT.fullmatch(ip)]
        if errs:
            p = len(errs) * 5
            fmt_fb.append(f"⚠️ {len(errs)} invalid IP format(s): −{p} pts")
            score -= p

        if assignment_type == 'static':
            # (static routing logic unchanged…)
            master_routes = []
            for line in STATIC_ROUTE_PAT.findall(mtxt):
                p = line.split()
                if len(p) < 5:
                    continue
                master_routes.append((p[2], mask_to_cidr(p[3]), p[4]))

            student_raw  = []
            student_dict = {}
            for line in STATIC_ROUTE_PAT.findall(stxt):
                p = line.split()
                if len(p) < 5:
                    continue
                d, m_, nh_ = p[2], p[3], p[4]
                cm = mask_to_cidr(m_)
                student_raw.append((d, cm, nh_))
                student_dict.setdefault((d, cm), []).append(nh_)

            N        = max(len(master_routes), 1)
            share    = 100.0 / N
            miss_pen = 0.0

            direct_nh = expected_neighbors[rname]
            for _, _, nh in student_raw:
                if nh not in direct_nh:
                    miss_pen += share
                    static_fb.append(
                        f"❌ Multi-hop next-hop {nh} not directly connected: −{round(share,1)} pts"
                    )

            for dest, mlen, nh in master_routes:
                key = (dest, mlen)
                if key in student_dict:
                    nhs = student_dict[key]
                    if nh in nhs:
                        continue
                    else:
                        pen = share * (1 - STATIC_NEXT_HOP_CREDIT)
                        static_fb.append(f"❌ {dest}/{mlen} wrong next-hop: −{round(pen,1)} pts")
                else:
                    if any(d == dest for d, _, _ in student_raw):
                        pen = share * (1 - STATIC_MASK_CREDIT)
                        static_fb.append(f"❌ {dest} wrong mask: −{round(pen,1)} pts")
                    else:
                        pen = share
                        static_fb.append(f"❌ Missing {dest}/{mlen}: −{round(pen,1)} pts")
                miss_pen += pen

            miss_pen = min(miss_pen, STATIC_MISSING_DEDUCTION_CAP)
            score -= miss_pen

            dup_count = sum(c - 1 for c in Counter((d, m) for d, m, _ in student_raw).values() if c > 1)
            if dup_count:
                dup_pen = min(dup_count * STATIC_DUPLICATE_DEDUCTION, 10)
                static_fb.append(f"❌ Duplicate static destinations: −{dup_pen} pts")
                score -= dup_pen

            if not static_fb:
                static_fb.append("✅ All required static routes configured!")
        else:
            # (OSPF logic unchanged…)
            m_nets = parse_ospf_networks(mtxt)
            s_nets = parse_ospf_networks(stxt)

            missing = m_nets - s_nets
            if missing:
                mp = min(len(missing) * OSPF_MISSING_DEDUCTION_PER_NET, OSPF_MISSING_DEDUCTION_CAP)
                ospf_fb.append(f"❌ Missing OSPF net(s): {sorted(missing)} −{mp} pts")
                score -= mp

            extra = s_nets - m_nets
            if extra:
                ep = min(len(extra) * OSPF_EXTRA_DEDUCTION_PER_NET, OSPF_EXTRA_DEDUCTION_CAP)
                ospf_fb.append(f"⚠️ Extra OSPF net(s): {sorted(extra)} −{ep} pts")
                score -= ep

            if not missing and not extra:
                ospf_fb.append("✅ All OSPF networks present!")

            mnb      = parse_ospf_neighbors(m_neigh.get(rname, ""))
            snb      = parse_ospf_neighbors(s_neigh.get(rname, ""))
            miss_nb  = expected_neighbors[rname] - snb
            if miss_nb:
                ospf_fb.append(f"�⚠ Missing OSPF neighbor(s): {sorted(miss_nb)}")
            extra_nb = snb - expected_neighbors[rname]
            if extra_nb:
                ospf_fb.append(f"⚠️ Unexpected OSPF neighbor(s): {sorted(extra_nb)}")

            if STATIC_ROUTE_PAT.search(stxt):
                ospf_fb.append(f"❌ Static routes in OSPF assignment: −{HOSTNAME_DEDUCTION} pts")
                score -= HOSTNAME_DEDUCTION

        hn = get_hostname(stxt)
        if not hn:
            hostname_fb.append(f"❌ Missing hostname: −{HOSTNAME_DEDUCTION} pts")
            score -= HOSTNAME_DEDUCTION
        elif hn.lower() == "router":
            hostname_fb.append(f"❌ Default hostname: −{HOSTNAME_DEDUCTION} pts")
            score -= HOSTNAME_DEDUCTION

        fb = []
        if static_fb:   fb += ["--- Static Routing ---"] + static_fb
        if ospf_fb:     fb += ["--- OSPF Routing ---"]  + ospf_fb
        if mask_fb or fmt_fb:
            fb += ["--- Mask & Format ---"] + mask_fb + fmt_fb
        if hostname_fb:
            fb += ["--- Hostname ---"] + hostname_fb

        per_router[rname] = {"score": round(score,1), "feedback": fb}
        router_scores.append(score)

    # 8) AGGREGATE & TOPOLOGY CHECK
    routing_score = round(sum(router_scores)/len(router_scores),1)
    student_all   = {
        r: parse_router_subnets(normalize_ips(txt, norm_prefix))
        for r, txt in scfgs.items()
    }
    s_edges = build_edges(student_all)

    if not all_reachable(s_edges):
        topo_fb, td = ["❌ Network partition detected"], 20
    else:
        total   = len(m_edges)
        missing = [e for e in m_edges if e not in s_edges]
        cnt     = len(missing)
        if cnt == 0:
            topo_fb, td = ["✅ Topology matches!"], 0
        elif cnt >= total/2:
            topo_fb, td = [f"❌ {cnt} missing links ≥ half: −50 pts"], 50
        elif cnt >= 2:
            topo_fb, td = [f"❌ {cnt} missing links: −30 pts"], 30
        else:
            topo_fb, td = ["❌ 1 missing link: −10 pts"], 10

    final_score = max(round(routing_score - td,1), 0.0)

    # ─── Convert edge keys to JSON‐serializable strings ─────────────────────────
    serial_m_edges = {"-".join(edge): net for edge, net in m_edges.items()}
    serial_s_edges = {"-".join(edge): net for edge, net in s_edges.items()}

    return {
        "assignment_type":   assignment_type,
        "num_routers":       len(mcfgs),
        "per_router":        per_router,
        "routing_score":     routing_score,
        "topology_feedback": topo_fb,
        "master_edges":      serial_m_edges,
        "student_edges":     serial_s_edges,
        "final_score":       final_score
    }

def format_summary(summary: dict) -> str:
    lines = []
    lines.append(f"Type of routing : {summary['assignment_type'].upper()}")
    lines.append(f"Number of Router : {summary['num_routers']}")
    lines.append(f"final score : {summary['final_score']}\n")

    lines.append("score breakdown :")
    for r, d in summary["per_router"].items():
        lines.append(f"{r} : {d['score']}")
    lines.append("")

    lines.append("Feedback :")
    for r, d in summary["per_router"].items():
        for fb in d["feedback"]:
            lines.append(f"{r} : {fb}")

    lines.append("\nTopology (Master):")
    for link, net in summary["master_edges"].items():
        lines.append(f"{link} : {net}")
    lines.append("\nTopology (Student):")
    for link, net in summary["student_edges"].items():
        lines.append(f"{link} : {net}")

    return "\n".join(lines)

if __name__ == "__main__":
    import argparse, json

    p = argparse.ArgumentParser(description="Run ZIP-based router grader")
    p.add_argument("master_zip")
    p.add_argument("student_zip")
    p.add_argument("master_neigh_zip")
    p.add_argument("student_neigh_zip")
    p.add_argument("birthday_prefix")
    p.add_argument("--master_prefix", default=None)
    args = p.parse_args()

    summary = grade_all(
        master_zip        = args.master_zip,
        student_zip       = args.student_zip,
        master_neigh_zip  = args.master_neigh_zip,
        student_neigh_zip = args.student_neigh_zip,
        birthday_prefix   = args.birthday_prefix,
        master_prefix     = args.master_prefix
    )
    print(json.dumps(summary))
