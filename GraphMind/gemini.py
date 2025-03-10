import requests
import json
import re

from typing import Dict, Any

from dotenv import load_dotenv
import os

load_dotenv()

class GeminiAI:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.context = {}
        self.base_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.api_key}'

    def set_context(self, context: Dict[str, Any]) -> None:
        """Establece el contexto inicial"""
        self.context = context

    def add_context(self, additional_context: Dict[str, Any]) -> None:
        """Agrega un nuevo contexto al contexto actual"""
        self.context.update(additional_context)

    def build_prompt(self, prompt: str, context: Dict[str, Any]) -> str:
        """Construye el mensaje final a enviar al modelo"""
        if context:
            return f'Contexto actual: {json.dumps(context)}\n\n{prompt}'
        return prompt

    def ask_question(self, prompt: str, custom_context: Dict[str, Any] = None) -> Any:
        """Hace la consulta al modelo de Gemini"""
        context_to_use = custom_context if custom_context else self.context
        final_prompt = self.build_prompt(prompt, context_to_use)

        # Estructura del cuerpo de la solicitud
        request_body = {
            "contents": [
                {"parts": [{"text": final_prompt}]}
            ]
        }

        try:
            # Realiza la solicitud a la API
            response = requests.post(self.base_url, headers={"Content-Type": "application/json"}, json=request_body)

            # Verifica si la respuesta es exitosa
            if response.status_code != 200:
                raise Exception(f"Error en la API: {response.status_code} - {response.text}")

            # Procesa la respuesta JSON
            data = response.json()

            # Obtiene el texto de la respuesta
            res = data["candidates"][0]["content"]["parts"][0]["text"]

            # Intenta extraer un JSON desde un bloque de código en el formato `json`
            match = self.extract_json_from_response(res)

            if match:
                return match
            return res
        except Exception as error:
            raise Exception(f"Error al procesar la solicitud: {str(error)}")

    def extract_json_from_response(self, response: str) -> Any:
        """Extrae JSON de una respuesta en bloque de código"""
        try:
            # Busca una cadena con formato de bloque JSON
            match = re.search(r'```json\n([\s\S]*?)\n```', response)
            if match:
                # Intenta parsear el JSON extraído
                return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
        return None

# Ejemplo de uso:
if __name__ == "__main__":
    api_key = "AIzaSyDWzzkTZqF73PdaxztjbdXcCo8sAEwkV7Y"  # Sustituir por tu clave de API
    gemini = GeminiAI(api_key)

    gemini.set_context({"tema": "Segunda Guerra Mundial", "subtema": "Tratado de Versalles"})

    prompt = "¿Cuáles fueron las principales consecuencias del Tratado de Versalles?"

    try:
        respuesta = gemini.ask_question(prompt)
        print("Respuesta del modelo:", respuesta)
    except Exception as error:
        print("Error:", error)
