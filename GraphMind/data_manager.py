import os
import json

DATA_DIR = "knowledges"

import re

def safe_idea_name(idea):
    return re.sub(r'[\\/*?:"<>|]', '_', idea)

def guardar_conexiones(idea, conexiones, idea_principal):
    """
    Guarda la información en un archivo JSON en una subcarpeta nombrada según la idea principal.
    """
    if not conexiones:
        return

    safe_idea = safe_idea_name(idea)
    safe_idea_principal = safe_idea_name(idea_principal)
    subcarpeta = os.path.join(DATA_DIR, safe_idea_principal)
    os.makedirs(subcarpeta, exist_ok=True)
    filepath = os.path.join(subcarpeta, f"{safe_idea}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(conexiones, f, ensure_ascii=False, indent=4)
    print(f"Guardado en archivo: {filepath}")

def cargar_conexiones(idea, idea_principal):
    """
    Carga la información de un archivo JSON si existe.
    """
    safe_idea = safe_idea_name(idea)
    safe_idea_principal = safe_idea_name(idea_principal)
    subcarpeta = os.path.join(DATA_DIR, safe_idea_principal)
    os.makedirs(subcarpeta, exist_ok=True)
    filepath = os.path.join(subcarpeta, f"{safe_idea}.json")
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception as e:
            print(f"Error al cargar conexiones de {idea}: {e}")
    return {}
