import os, re

ROOT = "."
EXTS = (".js", ".ts", ".tsx")

total_files = 0
total_lines = 0
total_functions = 0
total_comments = 0

for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root:
        continue

    for f in files:
        if f.endswith(EXTS):
            total_files += 1
            path = os.path.join(root, f)

            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                    text = fp.read()

                lines = text.splitlines()
                total_lines += len(lines)

                total_comments += sum(
                    1 for line in lines
                    if line.strip().startswith("//")
                    or line.strip().startswith("/*")
                    or line.strip().startswith("*")
                )

                total_functions += len(re.findall(
                    r'function\s+\w+|\w+\s*=\s*\([^)]*\)\s*=>',
                    text
                ))
            except Exception:
                pass

print("=" * 50)
print("PROJECT CODE QUALITY METRICS")
print("=" * 50)
print(f"Files analysed      : {total_files}")
print(f"Lines of code       : {total_lines}")
print(f"Functions detected  : {total_functions}")
print(f"Comment lines       : {total_comments}")
if total_lines:
    print(f"Comment ratio       : {(total_comments/total_lines)*100:.2f}%")
print("=" * 50)
