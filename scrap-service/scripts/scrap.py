import time
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from pymongo import MongoClient
from .date_utils import parse_date, format_date_standard

MONGO_URI = "mongodb+srv://JobDB:1605@jobapp.jdgud85.mongodb.net/JobDB?retryWrites=true&w=majority"
DB_NAME = "JobDB"
COLLECTION_NAME = "Offres_Collections"

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(options=chrome_options)

def get_derniere_date_par_site_mongo(domaine):
    client = MongoClient(MONGO_URI)
    collection = client[DB_NAME][COLLECTION_NAME]
    offres = list(collection.find({"Lien": {"$regex": domaine}}))
    dates = [parse_date(o.get("Date", "")) for o in offres if o.get("Date")]
    return max(dates) if dates else datetime.min

def scrape_emploi_ma():
    all_jobs = []
    stop_scraping = False
    derniere_date = get_derniere_date_par_site_mongo("emploi.ma")

    driver.get("https://www.emploi.ma/recherche-jobs-maroc")
    time.sleep(3)
    pagination_links = driver.find_elements(By.CSS_SELECTOR, "li.pager-item.active.pagination-numbers a")
    last_page_number = int(pagination_links[-1].text.strip()) if pagination_links else 1

    for page in range(last_page_number):
        if stop_scraping: break
        url = "https://www.emploi.ma/recherche-jobs-maroc" if page == 0 else f"https://www.emploi.ma/recherche-jobs-maroc?page={page}"
        driver.get(url)
        time.sleep(2)

        cards_featured = driver.find_elements(By.CSS_SELECTOR, "div.card.card-job.featured")
        cards_normal = driver.find_elements(By.CSS_SELECTOR, "div.card.card-job:not(.featured)")
        cards = cards_featured + cards_normal
        for card in cards:
            try:
                detail = card.find_element(By.CLASS_NAME, "card-job-detail")
                title = detail.find_element(By.CSS_SELECTOR, "h3 a").get_attribute("title")
                link = detail.find_element(By.CSS_SELECTOR, "h3 a").get_attribute("href")
                full_link = "https://www.emploi.ma" + link if link.startswith("/") else link

                company = detail.find_element(By.CSS_SELECTOR, "a.card-job-company.company-name").text.strip() if \
                    detail.find_elements(By.CSS_SELECTOR, "a.card-job-company.company-name") else "Entreprise non précisée"
                infos = detail.find_elements(By.CSS_SELECTOR, "ul li strong")
                studies = infos[0].text.strip() if len(infos) > 0 else ""
                experience = infos[1].text.strip() if len(infos) > 1 else ""
                contract = infos[2].text.strip() if len(infos) > 2 else ""
                region = infos[3].text.strip() if len(infos) > 3 else ""
                date = detail.find_element(By.TAG_NAME, "time").text.strip()
                date_obj = parse_date(date)
                if date_obj <= derniere_date:
                    stop_scraping = True
                    break

                all_jobs.append({
                    "Titre": title,
                    "Lien": full_link,
                    "Entreprise": company,
                    "Études": studies,
                    "Expérience": experience,
                    "Type de contrat": contract,
                    "Région": region,
                    "Date": format_date_standard(date_obj),
                    "Description": ""
                })
            except:
                continue
    return all_jobs

def scrape_rekrute():
    all_jobs = []
    stop_scraping = False
    derniere_date = get_derniere_date_par_site_mongo("rekrute.com")

    driver.get("https://www.rekrute.com/offres.html?s=3&p=1&o=1")
    time.sleep(3)

    try:
        pagination_text = driver.find_element(By.XPATH, '//*[@id="fortopscroll"]/div[2]/div/div/div/div[3]/div/div[3]/div[1]/div/span').text.strip()
        total_pages = int(re.search(r"sur\s+(\d+)", pagination_text).group(1))
    except:
        total_pages = 1

    for page in range(1, total_pages + 1):
        if stop_scraping: break
        driver.get(f"https://www.rekrute.com/offres.html?s=3&p={page}&o=1")
        time.sleep(2)

        cards = driver.find_elements(By.CSS_SELECTOR, "li.post-id")
        for card in cards:
            try:
                title_tag = card.find_element(By.CSS_SELECTOR, "a.titreJob")
                raw_title = title_tag.text.strip()
                link = title_tag.get_attribute("href")

                if "|" in raw_title:
                    title, region = map(lambda x: x.replace("(Maroc)", "").strip(), raw_title.split("|", 1))
                else:
                    title, region = raw_title, ""

                company = card.find_element(By.CSS_SELECTOR, "img.photo").get_attribute("title") if \
                    card.find_elements(By.CSS_SELECTOR, "img.photo") else "Entreprise non précisée"
                
                try:
                    date_elem = card.find_element(By.XPATH, './/em[@class="date"]/span[1]')
                    date = date_elem.text.strip()
                except:
                    date = ""

                date_obj = parse_date(date)

                if date_obj <= derniere_date:
                    stop_scraping = True
                    break

                study = exp = contract = ""
                for li in card.find_elements(By.CSS_SELECTOR, "ul li"):
                    text = li.text.strip()
                    if "Niveau d'étude" in text:
                        study = text.replace("Niveau d'étude demandé :", "").strip()
                    elif "Expérience requise" in text:
                        exp = text.replace("Expérience requise :", "").strip()
                    elif "Type de contrat" in text:
                        contract = text.replace("Type de contrat proposé :", "").split("-")[0].strip()

                all_jobs.append({
                    "Titre": title,
                    "Lien": link,
                    "Entreprise": company,
                    "Études": study,
                    "Expérience": exp,
                    "Type de contrat": contract,
                    "Région": region,
                    "Date": format_date_standard(date_obj),
                    "Description": ""
                })
            except:
                continue
    return all_jobs

def ajouter_descriptions(offres):
    for job in offres:
        try:
            driver.get(job["Lien"])
            time.sleep(2)
            if "emploi.ma" in job["Lien"]:
                desc = driver.find_element(By.CSS_SELECTOR, "div.job-description").text.strip() if driver.find_elements(By.CSS_SELECTOR, "div.job-description") else ""
                qualif = driver.find_element(By.CSS_SELECTOR, "div.job-qualifications").text.strip() if driver.find_elements(By.CSS_SELECTOR, "div.job-qualifications") else ""
                job["Description"] = f"{desc}\n\n{qualif}".strip()
            elif "rekrute.com" in job["Lien"]:
                desc_poste = desc_profil = ""
                blocs = driver.find_elements(By.XPATH, '//div[contains(@class, "col-md-12") and .//h2]')
                for bloc in blocs:
                    h2 = bloc.find_element(By.TAG_NAME, "h2").text.strip().lower()
                    txt = bloc.text.strip()
                    if "poste" in h2:
                        desc_poste = txt
                    elif "profil recherché" in h2:
                        desc_profil = txt
                job["Description"] = f"{desc_poste}\n\n{desc_profil}".strip()
        except:
            job["Description"] = ""

def close_driver():
    driver.quit()