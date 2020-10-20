# Produce a .csv audit report of outdated dependencies (yarn)
# script : yarn outdated | python3 ./audit/outdated.py -i > ./audit/audit-outdated.csv

import re
import sys
import argparse

def parse(stdin=False, file_path=""):
    if stdin:
        process_data(sys.stdin)
    elif file_path != "":
        with open(file_path, 'r', encoding='utf-8') as f:
            process_data(f)
    else:
        print("[-] You must specify a path or pass json via stdin using -i")

def process_data(f):
    entries = []
    for line in f:
        entries.append(line.rstrip('\n|\r'))
    entries = entries[6:-1]

    print("Package\tCurrent\tWanted\tLatest\tPackage Type\tURL")
    
    for entry in entries:
        line = re.sub("\s+", "\t", entry)
        line = re.sub("(?i)dependencies", "", line)
        print(line)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", dest="stdin", help="Takes input from stdin instead of a file",
                        action="store_true")
    parser.add_argument("-f", "--file", help="Path for json file")
    args = parser.parse_args()
    parse(stdin=args.stdin, file_path=args.file)

if __name__ == "__main__":
    main()
