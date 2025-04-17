from datetime import datetime

def parse_date(date_str):
    for fmt in ("%d.%m.%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.min

def format_date_standard(date_obj):
    return date_obj.strftime("%d/%m/%Y")