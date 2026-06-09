from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()

driver.get("http://localhost:5173")

wait = WebDriverWait(driver,10)

email = wait.until(
    EC.presence_of_element_located(
        (By.NAME,"email")
    )
)

password = driver.find_element(
    By.NAME,
    "password"
)

email.send_keys("admin@clarity.com")
password.send_keys("clarity123")

driver.find_element(
    By.TAG_NAME,
    "button"
).click()

print("Login test executed")

input("Press Enter to close")

driver.quit()