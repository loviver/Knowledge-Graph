from .data_manager import cargar_conexiones, guardar_conexiones

def explorar_tema(idea, gemini_client, idea_principal, profundidad_maxima=2, profundidad_actual=0, datos_cargados=None):
    """
    Explora un tema de forma recursiva. Si no hay datos guardados, consulta a Gemini y guarda el resultado.
    """
    if datos_cargados is None:
        datos_cargados = {}

    print(f"Explorando {idea}...")

    conexiones = datos_cargados.get(idea)
    if not conexiones:
        conexiones = cargar_conexiones(idea, idea_principal)
        if not conexiones:
            conexiones = gemini_client.obtener_conexiones(idea)
            if conexiones:
                guardar_conexiones(idea, conexiones, idea_principal)
    
    if conexiones and profundidad_actual < profundidad_maxima:
        sub_ideas = list(conexiones.keys())
        print(f"Conexiones de {idea}: {sub_ideas}")

        # Explorar cada subtema
        for sub_idea in sub_ideas:
            if sub_idea not in datos_cargados:
                print(f"Explorando subtema: {sub_idea}")
                conexiones_subtema = gemini_client.obtener_conexiones(
                    f"{sub_idea} de {idea} de la idea principal {idea_principal}"
                )
                if conexiones_subtema:
                    guardar_conexiones(sub_idea, conexiones_subtema, idea_principal)
        for sub_idea in sub_ideas:
            if sub_idea not in datos_cargados:
                explorar_tema(sub_idea, gemini_client, idea_principal, profundidad_maxima, profundidad_actual + 1, datos_cargados)
    return conexiones

def explorar_tema_cargado(tema, G, idea_principal, profundidad=2):
    """
    Explora y construye el grafo a partir de la información guardada en archivos JSON.
    """
    conexiones = cargar_conexiones(tema, idea_principal)
    if conexiones:
        for subtema, sub_conexiones in conexiones.items():
            print(f"[loading] {tema} -> {subtema}")
            G.add_edge(tema, subtema)
            for sub_subtema in sub_conexiones:
                G.add_edge(subtema, sub_subtema)
                if profundidad > 0:
                    explorar_tema_cargado(sub_subtema, G, idea_principal, profundidad - 1)

class ExploradorTematico:
    def __init__(self, idea_principal, modo="cargar"):
        """
        :param modo: "investigar" para obtener datos nuevos o "cargar" para usar los archivos guardados.
        """
        self.modo = modo
        self.idea_principal = idea_principal
    
    def ejecutar(self, idea, gemini_client, G, profundidad=2):
        if self.modo == "investigar":
            explorar_tema(idea, gemini_client, self.idea_principal, profundidad_maxima=profundidad)
        else:
            explorar_tema_cargado(idea, G, self.idea_principal, profundidad)
