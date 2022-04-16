from time import sleep
from datetime import datetime
from datetime import timedelta
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import logging
import os
import gspread
import pytz
import json
import base64
import re

# leaderboard constants
LBOARD_PAGE_URL = "https://www.nytimes.com/puzzles/leaderboards"
LBOARD_XPATH = "//*[@id=\"lbd-root\"]/div"
LBOARD_ITEMS_XPATH = "//*[@id=\"lbd-root\"]/div/div[2]"

# spreadsheet constants
SHEETS_URL = "https://docs.google.com/spreadsheets/d/1ou_zO3RCQu5nEkfaNDPcuncjsytl8ijJ8KqHJVYauyo"
SHEET_DATE_COL = 1

SCOPE = ['https://www.googleapis.com/auth/spreadsheets']


auth_dict = {
  "type": "service_account",
  "project_id": "mini-crossword-updater",
  "private_key_id": os.environ['GAPI_PRIV_KEY_ID'],
  "private_key": os.environ['GAPI_PRIV_KEY'].replace(r'\n', '\n'), # actually put in the newlines
  "client_email": os.environ['GAPI_CLIENT_EMAIL'],
  "client_id": os.environ['GAPI_CLIENT_ID'],
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": os.environ['GAPI_CLIENT_CERT_URL']
}

client = gspread.service_account_from_dict(auth_dict, scopes=SCOPE)
doc = client.open_by_url(SHEETS_URL)

def is_weekend(date: datetime) -> bool:
    return date.weekday() == 6 or date.weekday() == 5

class NYTCrossword():

    @staticmethod
    def update_crossword_scores():
        s = doc.worksheets()[0]

        # set up selenium
        chrome_options = webdriver.ChromeOptions()
        chrome_options.binary_location = os.environ["GOOGLE_CHROME_BIN"]
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--no-sandbox")

        driver = webdriver.Chrome(executable_path=os.environ["CHROMEDRIVER_PATH"], chrome_options=chrome_options)


        try:
            driver.get(LBOARD_PAGE_URL)
            logging.info("Loading leaderboard")

            cookies_decoded = base64.b64decode(os.environ['NYT_COOKIES']).decode('utf-8')
            cookies_json = json.loads(cookies_decoded)


            for cookie in cookies_json:
                driver.add_cookie(cookie)

            driver.refresh()

            # wait for the leaderboard to load
            WebDriverWait(driver, 5).until(
                EC.visibility_of(driver.find_element_by_xpath(LBOARD_XPATH))
            )
            sleep(1) # extra sleep just in case

            logging.info("Leaderboard loaded")
            right_now = datetime.now(tz=pytz.timezone('US/Eastern'))
            
            # check if tomorrow's puzzle is already published
            if ((is_weekend(right_now) and right_now.hour >= 18) or 
                    (not is_weekend(right_now) and right_now.hour >= 22)):
                right_now += timedelta(days=1)

            row_date = right_now.strftime("%m/%d/%Y") # today's date formatted
            dates = s.col_values(SHEET_DATE_COL)
            today_rows = {}                                  # dict that stores each person's row number for today's entry if it exists
            for i in range(len(dates)-1, -1, -1):
                examined_date = datetime.strptime(dates[i], "%m/%d/%Y")
                # exit for loop if we've already gone past all of today's dates
                if examined_date.date() < right_now.date():
                    break
                elif examined_date.date() == right_now.date():
                    name = s.row_values(i+1)[1]
                    today_rows[name] = i+1
            
            lboard_items = driver.find_element_by_xpath(LBOARD_ITEMS_XPATH)
            for entry in lboard_items.find_elements_by_class_name("lbd-score"):
                name = entry.find_element_by_class_name("lbd-score__name").text
                if name[-5:] == "(you)":
                    name = name[0:-6] # remove the (you) classifier

                # if I haven't done it yet
                if len(entry.find_elements_by_class_name("lbd-score__time")) == 0:
                    logging.info("Skipping myself because I haven't done it yet!")
                    continue
                
                time = entry.find_element_by_class_name("lbd-score__time").text
                
                # skip if they haven't finished it yet
                if time == "--":
                    logging.info(f"Skipping user: {name} - (not complete)")
                    continue
                
                time_min_str = re.match('[0-9]*', time).group()
                time_sec = int(time[len(time_min_str)+1:])
                
                total_sec = int(time_min_str) * 60 + time_sec
                # format the row to be entered in google sheets
                row_entry = [row_date, name, total_sec]
                
                start_cell = None
                
                # check for updates
                if name in today_rows.keys():
                    today_r_num = today_rows[name]
                    if s.row_values(today_r_num) != row_entry:
                        logging.info(f"Updating entry: {row_entry}")
                        start_cell = gspread.utils.rowcol_to_a1(today_r_num, SHEET_DATE_COL)
                    else:
                        logging.info(f"Skpping user: {name} - (already updated)")
                else:
                    # adding a new entry for today
                    logging.info(f"Adding new entry: {row_entry}")
                    start_cell = gspread.utils.rowcol_to_a1(len(s.col_values(SHEET_DATE_COL)) + 1, SHEET_DATE_COL)

                s.update(start_cell, [[cell] for cell in row_entry], major_dimension="columns")    
        except Exception as e:
            logging.error(e)

        finally:
            logging.info("Quitting webdriver")
            driver.quit()
