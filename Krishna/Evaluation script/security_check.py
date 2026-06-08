import os,re

ROOT="."
patterns={
"Hardcoded Secret":r"(password\s*=|secret\s*=|api[_-]?key\s*=|token\s*=)",
"Console Logging":r"console\.log\(",
"TODO/FIXME":r"TODO|FIXME"
}

print("="*50)
print("SECURITY & MAINTAINABILITY REVIEW")
print("="*50)

for issue,pattern in patterns.items():
    count=0
    for root,dirs,files in os.walk(ROOT):
        if "node_modules" in root:
            continue
        for f in files:
            if f.endswith((".js",".ts",".tsx")):
                p=os.path.join(root,f)
                try:
                    txt=open(p,encoding="utf-8",errors="ignore").read()
                    count += len(re.findall(pattern,txt,re.IGNORECASE))
                except:
                    pass
    print(f"{issue}: {count}")
