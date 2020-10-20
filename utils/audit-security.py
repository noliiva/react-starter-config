# Works only with yarn audit
# Crash on stdin mode if jsonl is too large
# yarn audit --json > ./audit/tmp.jsonl ; python3 ./audit/security.py -f ./audit/tmp.jsonl > ./audit/audit-security.csv ; rm ./audit/tmp.jsonl

import sys
import json
import argparse

def get_root_deps(paths):
    deps = []
    for d in paths:
        libs = d.split(">")
        root = libs[0] 
        if root not in deps:
            deps.append(root)
    res = ", ".join(deps)
    return res

def parse(stdin=False, file_path=""):
    if stdin:
        process_data(sys.stdin)
    elif file_path != "":
        with open(file_path, 'r', encoding='utf-8') as f:
            process_data(f)
    else:
        print("[-] You must specify a path or pass json via stdin using -i")

def process_data(f):

    print("Package\tVersion\tPatched versions\tDependency of\tVulnerability\tCVE\tSeverity\tInfo")
    
    entries = []
    for line in f:
        l = line.rstrip('\n|\r')
        j = json.loads(l)
        entries.append(j)

    packages = []
    for entry in entries:
        data = entry["data"]
        advisory = data.get('advisory')

        if advisory:
            package = advisory["module_name"]
            findings = advisory["findings"][0]
            version = findings["version"]
            paths = findings["paths"]
            pachted_versions = advisory["patched_versions"]
            dependency_of = get_root_deps(paths)
            vulnerability = advisory["title"]
            severity = advisory["severity"]
            info = advisory["url"]

            cves = advisory["cves"]
            cve = "N/A"
            if len(cves) > 0:
                cve = ", ".join(cves)

            key = package+version+vulnerability+cve
            if key not in packages:
                packages.append(key)
                print(f"{package}\t{version}\t{pachted_versions}\t{dependency_of}\t{vulnerability}\t{cve}\t{severity}\t{info}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", dest="stdin", help="Takes input from stdin instead of a file",
                        action="store_true")
    parser.add_argument("-f", "--file", help="Path for json file")
    args = parser.parse_args()
    parse(stdin=args.stdin, file_path=args.file)

if __name__ == "__main__":
    main()
