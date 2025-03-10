'use client'

import { useEffect, useState } from "react";
import axios from "axios";
import { GraphData } from "../types/graph";
import { Brain, Loader2, Search } from "lucide-react";
import TopicGraph from "../components/TopoGraph";

export default function HomeScreen() {
  const [data, setData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [knowledges, setKnowledges] = useState<string[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch available knowledges
    axios.get('http://localhost:5000/api/knowledges')
      .then((response: any) => {
        setKnowledges(response.data);
      })
      .catch((error: any) => {
        console.error('Error loading knowledges:', error);
      });
  }, []);

  const handleKnowledgeClick = async (knowledge: string) => {
    setLoading(true);
    setSelectedKnowledge(knowledge);
    try {
      const response = await axios.get(`http://localhost:5000/api/knowledges/${encodeURIComponent(knowledge)}`);
      setData(response.data);
    } catch (error) {
      console.error('Error loading knowledge data:', error);
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
        <div className="flex items-center gap-2 mb-8">
          <Brain className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Knowledge Graph</h2>
        </div>

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
          <div className="space-y-2">
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
              <TopicGraph data={data} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
