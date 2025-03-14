'use client'

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { GraphData } from "../types/graph";
import { Brain, Loader2, Search, Plus } from "lucide-react";
import TopoGraph from "../components/TopoGraph";

const socket = io('http://localhost:5000');

export default function HomeScreen() {
  const [data, setData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [knowledges, setKnowledges] = useState<string[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [depth, setDepth] = useState(4);

  const subscribeToTopic = useCallback((topic: string) => {
    /*
    if (selectedKnowledge) {
      socket.emit('unsubscribe', { topic: selectedKnowledge });
    }
    */
    socket.emit('subscribe', { topic });
  }, [selectedKnowledge]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Request initial knowledges list on connection
      socket.emit('get_knowledges');
    });

    socket.on('knowledges_list', (knowledgesList) => {
      setKnowledges(knowledgesList);
      setLoading(false);
    });

    socket.on('unsubscribed', (data) => {
      console.log('Unsuscription confirmed:', data.message);
    });

    socket.on('subscribed', (data) => {
      console.log('Subscription confirmed:', data.message);

      if (data.currentData) {
        setData(data.currentData);
        setLoading(false);
      }
    });

    socket.on('topic_update', (update) => {
      if (update.update) {
        setData(update.update);
      }
    });

    socket.on('knowledge_created', () => {
      socket.emit('get_knowledges');
    });

    return () => {
      socket.off('connect');
      socket.off('knowledges_list');
      socket.off('subscribed');
      socket.off('topic_update');
      socket.off('knowledge_created');
    };
  }, []);

  useEffect(() => {
    if (selectedKnowledge) {
      setLoading(true);
      subscribeToTopic(selectedKnowledge);
    }
  }, [selectedKnowledge, subscribeToTopic]);

  const handleKnowledgeClick = (knowledge: string) => {
    setSelectedKnowledge(knowledge);
  };

  const handleCreateTopic = async () => {
    if (!newTopic) return;
    
    setLoading(true);
    setSelectedKnowledge(newTopic);
    setNewTopic('');
    setIsCreating(false);
    
    try {
      await axios.post('http://localhost:5000/api/knowledges', {
        idea: newTopic,
        profundidad: depth
      });
    } catch (error) {
      console.error('Error creating topic:', error);
      setSelectedKnowledge(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredKnowledges = knowledges.filter(k => 
    k.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-xl border-r border-gray-100 p-6 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Knowledge Graph</h2>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Crear nuevo tema"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {isCreating && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Nuevo Tema de Investigación</h3>
            <input
              type="text"
              placeholder="Nombre del tema..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <input
              type="number"
              placeholder="Profundidad (1-10)"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              min="1"
              max="10"
              className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateTopic}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Search box */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar conocimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Conocimientos Disponibles
          </h3>
          <div className="space-y-2 max-h-[250px]">
            {filteredKnowledges.map((knowledge) => (
              <button
                key={knowledge}
                onClick={() => handleKnowledgeClick(knowledge)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all transform hover:scale-[1.02] ${
                  selectedKnowledge === knowledge
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                    : 'hover:bg-gray-50 text-gray-700 border border-gray-100'
                }`}
              >
                {knowledge}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Esquema Temático
              {selectedKnowledge && (
                <span className="ml-3 text-xl font-normal text-gray-600">
                  {selectedKnowledge}
                </span>
              )}
            </h1>
            {!selectedKnowledge && (
              <p className="mt-2 text-gray-600">
                Selecciona un conocimiento del menú lateral para visualizar su grafo temático.
              </p>
            )}
          </header>

          <div className="bg-white rounded-xl shadow-lg p-6 min-h-[600px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="text-gray-600 font-medium">Cargando datos...</span>
                </div>
              </div>
            ) : (
              <TopoGraph data={data} selectedKnowledge={selectedKnowledge} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}