import os
import json

DATA_DIR = "knowledges"

import re

def safe_idea_name(idea, max_length=100):
    safe_name = re.sub(r'[\\/*?:"<>|]', '_', idea)
    return safe_name[:max_length]

def guardar_conexiones(idea, conexiones, idea_principal):
    if not conexiones:
        return

    safe_idea = safe_idea_name(idea)
    safe_idea_principal = safe_idea_name(idea_principal)

    if not safe_idea_principal:  # Verifica que no sea vacío
        raise ValueError("idea_principal no puede estar vacío")

    subcarpeta = os.path.join(DATA_DIR, safe_idea_principal)
    os.makedirs(subcarpeta, exist_ok=True)
    filepath = os.path.join(subcarpeta, f"{safe_idea}.json")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(conexiones, f, ensure_ascii=False, indent=4)

    print(f"Guardado en archivo: {filepath}")

def cargar_conexiones(idea, idea_principal):
    safe_idea = safe_idea_name(idea)
    safe_idea_principal = safe_idea_name(idea_principal)

    if not safe_idea_principal:  # Verifica que no sea vacío
        raise ValueError("idea_principal no puede estar vacío")

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
