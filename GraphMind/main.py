import os
import json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import networkx as nx

from .gemini import GeminiAI  # Se asume que este módulo ya existe en tu paquete
from .explorer import ExploradorTematico
from .gemini_client import GeminiClient
from .explorer import ExploradorTematico

app = Flask(__name__)
CORS(app)

@app.route('/api/knowledges', methods=['GET'])
def get_knowledges():
    folder_path = 'knowledges'
    try:
        json_files = [f for f in os.listdir(folder_path)]
        return jsonify(json_files), 200
    except FileNotFoundError:
        return jsonify({"error": "La carpeta 'knowledges' no se encuentra"}), 404

@app.route('/api/knowledges/<topic>', methods=['GET'])
def get_knowledge_file(topic):
    folder_path = 'knowledges'
    file_path = os.path.join(folder_path, topic)

    if os.path.exists(file_path):

        explorador = ExploradorTematico(topic, modo='cargar')
        data = explorador.ejecutar(profundidad=2)

        return jsonify(data), 200
    else:
        return jsonify({"error": f"El archivo '{file_path}' no existe o no es un archivo JSON válido"}), 404

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
