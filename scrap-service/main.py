from pymongo import MongoClient
from pymongo import DESCENDING
from datetime import datetime
from scripts.scrap import scrape_emploi_ma, scrape_rekrute, ajouter_descriptions, close_driver

MONGO_URI = "mongodb+srv://JobDB:1605@jobapp.jdgud85.mongodb.net/JobDB?retryWrites=true&w=majority"
DB_NAME = "JobDB"
COLLECTION_NAME = "Offres_Collections"

def main():
    print("Début du scraping...")
    jobs = scrape_emploi_ma() + scrape_rekrute()
    print(f"{len(jobs)} offres récupérées.")

    ajouter_descriptions(jobs)
    close_driver()

    filtered = [j for j in jobs if all(j.get(k, '').strip() != '' for k in j)]
    print(f"{len(filtered)} offres après filtrage.")

    if filtered:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        collection.insert_many(filtered)
        
        docs = list(collection.find())

        try:
            docs.sort(
                key=lambda doc: datetime.strptime(doc.get("Date", "01/01/1900"), "%d/%m/%Y"),
                reverse=True
            )

            collection.drop()
            db[COLLECTION_NAME].insert_many(docs)
        except Exception as e:
            print(f"Erreur lors du tri des documents : {e}")

        print(f"{len(filtered)} offres insérées dans MongoDB.")
    else:
        print("Aucune offre à insérer.")

if __name__ == "__main__":
    main()