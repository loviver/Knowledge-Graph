from .rate_limiter import RateLimiter

class GeminiClient:
    def __init__(self, gemini_ai, rate_limiter=None):
        self.gemini = gemini_ai
        self.rate_limiter = rate_limiter if rate_limiter is not None else RateLimiter()
    
    def obtener_conexiones(self, idea):
        """
        Obtiene conexiones para una idea usando GeminiAI, controlando la tasa de peticiones.
        """
        self.rate_limiter.wait_if_needed()
        self.gemini.set_context({"idea_principal": idea})
        prompt = f"""
        Explica las conexiones y subtemas relacionados con {idea}, y devuelve las conexiones en formato JSON:

        {{
            "Conexión 1": ["Subtema 1.1", "Subtema 1.2"],
            "Conexión 2": ["Subtema 2.1", "Subtema 2.2"]
        }}

        Si es relevante, incluye una fecha.
        No agregues texto adicional, solo devuelve el JSON válido.
        """
        try:
            response = self.gemini.ask_question(prompt)
            if isinstance(response, dict):
                return response
            else:
                print("Respuesta inesperada:", response)
                return {}
        except Exception as e:
            print(f"Error al obtener las conexiones para '{idea}': {e}")
            return {}
