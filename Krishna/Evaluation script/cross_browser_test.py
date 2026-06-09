from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.firefox.service import Service as FirefoxService
import time

URL = "http://localhost:5173"

results = []

browsers = [
    ("Chrome", webdriver.Chrome),
    ("Edge", webdriver.Edge),
    ("Firefox", webdriver.Firefox)
]

for browser_name, browser_driver in browsers:

    try:

        driver = browser_driver()

        start = time.time()

        driver.get(URL)

        title = driver.title

        end = time.time()

        load_time = round(end - start, 2)

        results.append([
            browser_name,
            "PASS",
            load_time,
            title
        ])

        driver.quit()

    except Exception as e:

        results.append([
            browser_name,
            "FAIL",
            "-",
            str(e)
        ])

print("\nCROSS BROWSER TEST RESULTS")
print("-" * 80)

for result in results:

    print(
        f"Browser: {result[0]} | "
        f"Status: {result[1]} | "
        f"Load Time: {result[2]} sec | "
        f"Title/Error: {result[3]}"
    )