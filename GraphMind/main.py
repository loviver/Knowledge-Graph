import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from .explorer import ExploradorTematico

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

user_rooms = {}  # Diccionario para rastrear la sala actual de cada usuario

@app.route('/api/knowledges', methods=['GET'])
def get_knowledges():
    folder_path = 'knowledges'
    
    try:
        if not os.path.exists(folder_path):
            raise FileNotFoundError

        # Filtrar solo carpetas que contienen al menos un archivo .json
        valid_folders = [
            folder for folder in os.listdir(folder_path)
            if os.path.isdir(os.path.join(folder_path, folder)) and 
               any(f.endswith('.json') for f in os.listdir(os.path.join(folder_path, folder)))
        ]

        return jsonify(valid_folders), 200

    except FileNotFoundError:
        return jsonify({"error": "La carpeta 'knowledges' no se encuentra"}), 404

@app.route('/api/knowledges/<topic>', methods=['GET'])
def get_knowledge_file(topic):
    folder_path = 'knowledges'

    explorador = ExploradorTematico(topic, modo='cargar')
    data = explorador.ejecutar(profundidad=10)

    return jsonify(data), 200

@app.route('/api/knowledges', methods=['POST'])
def post_knowledge_file():
    idea = request.json.get('idea')
    profundidad = request.json.get('profundidad', 2)

    if not idea:
        return jsonify({"error": "El campo 'idea' es obligatorio"}), 400

    explorador = ExploradorTematico(idea, modo='investigar', socketio=socketio)
    data = explorador.ejecutar(profundidad=profundidad)
    return jsonify(data), 201

@socketio.on('subscribe')
def handle_subscribe(data):
    topic = data.get('topic')
    sid = request.sid  # ID de la sesión del cliente

    if topic:
        # Si el usuario ya estaba en una sala, lo sacamos de la anterior
        if sid in user_rooms:
            previous_topic = user_rooms[sid]
            leave_room(previous_topic)
            emit('unsubscribed', {"message": f"Desuscrito de {previous_topic}"}, room=sid)
        
        # Unirse a la nueva sala y actualizar el registro
        join_room(topic)
        user_rooms[sid] = topic

        response, status = get_knowledge_file(topic)
        emit('subscribed', {'message': f"Subscription to {topic}", 'currentData': response.json}, room=sid)

@socketio.on('unsubscribe')
def handle_unsubscribe(data):
    sid = request.sid
    if sid in user_rooms:
        topic = user_rooms.pop(sid)
        leave_room(topic)
        emit('unsubscribed', {"message": f"Desuscrito de {topic}"}, room=sid)

@socketio.on('update_topic')
def handle_update_topic(data):
    topic = data.get('topic')
    update_data = data.get('update')
    if topic and update_data:
        emit('topic_update', {"topic": topic, "update": update_data}, room=topic)

@socketio.on('get_knowledges')
def handle_get_knowledges():
    response, status = get_knowledges()
    emit('knowledges_list', response.json)

if __name__ == "__main__":
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)