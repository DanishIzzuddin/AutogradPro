import argparse
from backend.extractor.extractor import load_configs_from_zip
from backend.normalizer.normalizer import normalize_ips
from backend.grader.grader import grade_all

if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Grade ZIP-of-TXTs configs')
    p.add_argument('master_zip')
    p.add_argument('student_zip')
    p.add_argument('--birthday-prefix', required=True)
    p.add_argument('--master-prefix', default='10.0')
    args = p.parse_args()

    score, details = grade_all(
        args.master_zip, args.student_zip,
        args.birthday_prefix, args.master_prefix
    )
    print(f"Final Score: {score:.1f}/100")
    for router, d in details.items():
        print(f"\n--- {router} ---")
        print(f"Score: {d['score']}")
        print("Feedback:")
        for f in d['feedback']:
            print(f"  - {f}")
        print("Diff:")
        print("\n".join(d['diff']))
