import json
import networkx as nx

from .gemini import GeminiAI
from .data_manager import cargar_conexiones, guardar_conexiones
from .gemini_client import GeminiClient

def crear_json_grafico(G):
    """
    Crea y retorna un diccionario con los nodos y las conexiones del grafo.
    """
    graph_data = {
        'nodes': [{'id': node, 'label': node} for node in G.nodes()],
        'edges': [{'source': edge[0], 'target': edge[1]} for edge in G.edges()]
    }

    return graph_data

def explorar_tema_bfs(idea, gemini_client, idea_principal, socketio, profundidad_maxima=2):
    datos_cargados = {}
    # Cada elemento de la cola es una tupla: (idea, ruta, profundidad_actual)
    queue = [(idea, [idea], 0)]
    
    while queue:
        current_idea, ruta, profundidad_actual = queue.pop(0)
        print(f"[explorer] {current_idea} - {idea_principal} ({profundidad_actual}/{profundidad_maxima})")
        
        # Recuperar o cargar las conexiones del tema actual
        if current_idea in datos_cargados:
            conexiones = datos_cargados[current_idea]
        else:
            conexiones = cargar_conexiones(current_idea, idea_principal)
            if not conexiones:
                conexiones = gemini_client.obtener_conexiones(current_idea)
                if conexiones:
                    guardar_conexiones(current_idea, conexiones, idea_principal)
            datos_cargados[current_idea] = conexiones
        
        # Si hay conexiones y no hemos alcanzado la profundidad máxima, agregamos los subtemas a la cola
        if conexiones and profundidad_actual < profundidad_maxima:
            sub_ideas = list(conexiones.keys())
            for sub_idea in sub_ideas:
                nueva_ruta = ruta + [sub_idea]
                # Si el subtema aún no se ha cargado, lo consultamos y lo guardamos
                if sub_idea not in datos_cargados:
                    consulta = f"{sub_idea} de {' -> '.join(ruta)}"
                    conexiones_subtema = gemini_client.obtener_conexiones(consulta)
                    if conexiones_subtema:
                        guardar_conexiones(sub_idea, conexiones_subtema, idea_principal)
                        datos_cargados[sub_idea] = conexiones_subtema
                        socketio.emit('topic_update', {
                            "topic": idea_principal,
                            "update": crear_json_tema(idea_principal, nx.DiGraph(), profundidad=None)
                        }, room=idea_principal)
                # Agregar el subtema a la cola con la profundidad incrementada
                queue.append((sub_idea, nueva_ruta, profundidad_actual + 1))
    
    return datos_cargados.get(idea, {})


def crear_json_tema(tema, G, profundidad=2):
    """
    Crea un grafo a partir de un tema y su profundidad.
    """
    cargar_tema(tema, G, profundidad, tema)
    return crear_json_grafico(G)
def cargar_tema(tema, G, profundidad=None, idea_principal=None, visitados=None):
    """
    Explora y construye el grafo a partir de la información guardada en archivos JSON.
    - Si 'profundidad' es None, se carga todo el grafo hasta que no haya más conexiones.
    - Se usa un conjunto 'visitados' para evitar ciclos y redundancias.
    """
    if idea_principal is None:
        idea_principal = tema  # Mantener el contexto original

    if visitados is None:
        visitados = set()  # Conjunto para rastrear nodos visitados

    if tema in visitados:
        return  # Evita ciclos o exploraciones repetidas

    visitados.add(tema)  # Marcar como visitado

    conexiones = cargar_conexiones(tema, idea_principal)
    
    if conexiones:
        for subtema, sub_conexiones in conexiones.items():
            G.add_edge(tema, subtema)  # Agregar conexión principal
            for sub_subtema in sub_conexiones:
                G.add_edge(subtema, sub_subtema)  # Agregar subniveles
            
            # Control de profundidad
            if profundidad is None or profundidad > 0:
                nueva_profundidad = None if profundidad is None else profundidad - 1
                cargar_tema(subtema, G, nueva_profundidad, idea_principal, visitados)

class ExploradorTematico:
    def __init__(self, idea_principal, modo="cargar", socketio=None):
        """
        :param modo: "investigar" para obtener datos nuevos o "cargar" para usar los archivos guardados.
        """
        self.modo = modo
        self.socketio = socketio
        self.idea_principal = idea_principal
        
        self.gemini_ai = GeminiAI()
        self.gemini_client = GeminiClient(self.gemini_ai)
    
    def ejecutar(self, profundidad=2):
        if self.modo == "investigar":
            explorar_tema_bfs(
                self.idea_principal, 
                self.gemini_client, 
                self.idea_principal, 
                self.socketio,
                profundidad_maxima=profundidad
            )

            return
        else:
            G = nx.DiGraph()

            return crear_json_tema(self.idea_principal, G, None)
