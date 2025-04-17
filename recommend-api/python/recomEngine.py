import json, sys, nltk, os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.corpus import stopwords
import numpy as np
from collections import defaultdict

# Téléchargement silencieux des stopwords
nltk_data_path = os.path.expanduser('~/nltk_data')
if not os.path.exists(os.path.join(nltk_data_path, 'corpora/stopwords')):
    nltk.download('stopwords', quiet=True)

stop_words = stopwords.words("french")

# Nettoyage simple du texte
def nettoyer(text):
    return " ".join(text.lower().replace("-", " ").replace(",", " ").split())

# Calcul des scores TF-IDF
def calculer_scores_contenu(base_text, descriptions):
    corpus = [nettoyer(base_text)] + [nettoyer(d) for d in descriptions]
    tfidf = TfidfVectorizer(stop_words=stop_words, max_df=0.85, min_df=1).fit_transform(corpus)
    similarities = cosine_similarity(tfidf[0:1], tfidf[1:])[0]
    results = []
    for i, s in enumerate(similarities):
        raw_score = round(s * 100)
        score = max(0, min(raw_score, 25))
        final_score = round(75 + (score / 25) * 27)
        results.append({ "index": i, "score": final_score })
    return results

# Calcul filtrage collaboratif simple
def filtrage_collaboratif(userId, interactions, offer_ids):
    weights = { "Recommandé": 1, "Consulté": 2, "Postulé": 3 }
    users = list(set(i["userId"] for i in interactions))
    offers = list(set(offer_ids))
    user_idx = {u: i for i, u in enumerate(users)}
    offer_idx = {o: i for i, o in enumerate(offers)}

    matrix = np.zeros((len(users), len(offers)))
    for i in interactions:
        u = user_idx[i["userId"]]
        o = offer_idx[i["offerId"]]
        matrix[u][o] = weights.get(i["action"], 0)

    if userId not in user_idx:
        return []

    target = matrix[user_idx[userId]].reshape(1, -1)
    sims = cosine_similarity(target, matrix)[0]

    scores = defaultdict(float)
    counts = defaultdict(int)
    for i, sim in enumerate(sims):
        if users[i] == userId: continue
        for j in range(len(offers)):
            scores[offers[j]] += sim * matrix[i][j]
            if matrix[i][j] > 0:
                counts[offers[j]] += 1

    result = []
    for oid in scores:
        if counts[oid]:
            result.append({ "offerId": oid, "score": round(scores[oid] / counts[oid] * 100) })
    return result

# Fusion des deux systèmes
def combiner_scores(content_scores, collab_scores, offer_ids, alpha=0.95):
    collab_map = {c["offerId"]: c["score"] for c in collab_scores}
    final_scores = []

    for i, content in enumerate(content_scores):
        offer_id = offer_ids[content["index"]]
        c_score = content["score"]
        collab_score = collab_map.get(offer_id, 0)
        combined = round(alpha * c_score + (1 - alpha) * collab_score)
        final_scores.append({ "offerId": offer_id, "score": combined })

    return sorted(final_scores, key=lambda x: x["score"], reverse=True)

# Point d'entrée
if __name__ == "__main__":
    try:
        user_type = sys.argv[1]
        base_text = sys.argv[2]

        data = json.load(sys.stdin)
        descriptions = data["descriptions"]
        offer_ids = data["offerIds"]
        user_id = data["userId"]
        interactions = data["interactions"]

        content_scores = calculer_scores_contenu(base_text, descriptions)
        collab_scores = filtrage_collaboratif(user_id, interactions, offer_ids)
        hybrid_scores = combiner_scores(content_scores, collab_scores, offer_ids)

        print(json.dumps(hybrid_scores))
    except Exception as e:
        print(json.dumps({ "error": str(e) }))