import subprocess,sys

print("RUNNING PROJECT QUALITY ASSESSMENT\n")

print("\n[1] Code Metrics")
subprocess.run([sys.executable,"code_metrics.py"])

print("\n[2] Security Review")
subprocess.run([sys.executable,"security_check.py"])

print("\nQUALITY EVIDENCE GENERATED SUCCESSFULLY")
