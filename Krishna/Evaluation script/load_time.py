import requests
import time

url = "http://localhost:5173"

times = []

for i in range(20):

    start = time.time()

    requests.get(url)

    end = time.time()

    times.append(
        end-start
    )

avg = sum(times)/len(times)

print(
    "Average Response Time:",
    round(avg,4),
    "seconds"
)