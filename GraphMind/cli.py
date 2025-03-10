import argparse

import networkx as nx
from .gemini import GeminiAI  # Se asume que este módulo ya existe en tu paquete
from .explorer import ExploradorTematico
from .gemini_client import GeminiClient


def crear_grafico(G):
    """
    Crea y muestra un gráfico interactivo usando Plotly basado en el grafo de conexiones.
    """
    pos = nx.spring_layout(G)
    edge_x = []
    edge_y = []
    for edge in G.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])
    
    import plotly.graph_objects as go
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=0.5, color='#888'),
        hoverinfo='none',
        mode='lines'
    )
    
    node_x = []
    node_y = []
    for node in G.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)
    
    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers+text',
        text=list(G.nodes()),
        textposition='top center',
        marker=dict(size=10, color='blue')
    )
    
    fig = go.Figure(data=[edge_trace, node_trace],
                    layout=go.Layout(
                        title='Grafo de Conexiones',
                        showlegend=False,
                        hovermode='closest'
                    ))
    fig.show()

def main():
    # Configuración de los argumentos de la línea de comandos
    parser = argparse.ArgumentParser(description="Generador de gráficos de nodos para desglosar ideas.")
    parser.add_argument("--idea", type=str, help="Idea principal", default="Segunda Guerra Mundial")
    parser.add_argument("--modo", type=str, default="investigar", help="Modo a usar")
    parser.add_argument("--profundidad", type=int, default=3, help="Profundidad máxima de desglose")
    args = parser.parse_args()

    # Asignación de los valores pasados a las variables correspondientes
    idea_principal = args.idea
    max_depth = args.profundidad
    modo = args.modo

    # Inicialización de clases
    gemini_ai = GeminiAI()  # Inicialización de tu clase GeminiAI
    G = nx.DiGraph()
    
    gemini_client = GeminiClient(gemini_ai)
    explorador = ExploradorTematico(idea_principal, modo=modo)  # Usamos el modo proporcionado por los argumentos
    explorador.ejecutar(idea_principal, gemini_client, G, profundidad=max_depth)
    
    crear_grafico(G)

if __name__ == "__main__":
    main()
