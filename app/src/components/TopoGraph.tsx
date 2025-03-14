'use client'

import React, { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

const Plot = dynamic(()=> {return import ("react-plotly.js")}, {ssr: false})

import { uniqBy } from 'lodash';
import { Data, ScatterData, Layout } from 'plotly.js';
import { Node, Edge, GraphData, NodeType } from '../types/graph';
import { HoverCard } from './HoverCard';

interface TopicGraphProps {
  data: GraphData;
  selectedKnowledge: string | null;
}

const TopicGraph: React.FC<TopicGraphProps> = ({ data, selectedKnowledge }) => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [nodePositions, setNodePositions] = useState<{ x: number; y: number }[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [connectedTopics, setConnectedTopics] = useState<string[]>([]);
  const [layout, setLayout] = useState<Partial<Layout>>({
    title: 'Topic Relationship Graph',
    showlegend: false,
    hovermode: 'closest',
    margin: { l: 50, r: 50, t: 50, b: 50 },
    xaxis: { showgrid: false, zeroline: false, showticklabels: false },
    yaxis: { showgrid: false, zeroline: false, showticklabels: false },
    dragmode: 'pan',
  });

  useEffect(() => {
    const processData = () => {
      let nodes = uniqBy(data.nodes, 'id').map((node: Node) => ({
        ...node, 
        type: node.label == selectedKnowledge ? NodeType.Topic : NodeType.Subtopic
      }));
      let edges = data.edges;
      setGraphData({ nodes, edges });
      setNodePositions(calculateNodePositions(nodes, edges));
    };

    processData();
  }, [data]);

  useEffect(() => {
    console.log(connectedTopics);
  }, [connectedTopics]);

  useEffect(() => {
    if (hoveredNode) {
      const connected = getConnectedNodes(hoveredNode);
      setConnectedTopics(connected);
    } else {
      setConnectedTopics([]);
    }
  }, [hoveredNode]);
  
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  // Función pseudoaleatoria determinista basada en un seed
  const pseudoRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  // setConnectedTopics(connectedLabels);
  const calculateNodePositions = (nodes: Node[], edges: Edge[]) => {
    const positions: any = [];
    // Definir radios mínimos y máximos para la dispersión radial
    const minRadius = 5;
    const maxRadius = 15;
  
    // Calcular el grado de cada nodo (cantidad de conexiones)
    const nodeDegree: Record<string, number> = {};
    nodes.forEach(node => {
      nodeDegree[node.id] = 0;
    });
    edges.forEach(edge => {
      nodeDegree[edge.source] = (nodeDegree[edge.source] || 0) + 1;
      nodeDegree[edge.target] = (nodeDegree[edge.target] || 0) + 1;
    });
  
    const degreeValues = Object.values(nodeDegree);
    const minDegree = Math.min(...degreeValues);
    const maxDegree = Math.max(...degreeValues);
  
    nodes.forEach((node, i) => {
      // Distribución circular: cada nodo recibe un ángulo proporcional a su índice
      const angle = (i / nodes.length) * 2 * Math.PI;
      let r: number;
      if (maxDegree === minDegree) {
        // Si todos tienen la misma cantidad de conexiones, usamos un radio base medio.
        r = (minRadius + maxRadius) / 2;
      } else {
        // Nodos con mayor grado (más relevantes) se ubican más cerca del centro.
        r = minRadius + ((maxDegree - nodeDegree[node.id]) / (maxDegree - minDegree)) * (maxRadius - minRadius);
      }
      // Offsets pseudoaleatorios (determinísticos) basados en el ID del nodo
      const seed = hashCode(node.id);
      // Se generan offsets en un rango de -1 a 1
      const offsetX = pseudoRandom(seed) * 2 - 1;
      const offsetY = pseudoRandom(seed + 1) * 2 - 1;
  
      const x = r * Math.cos(angle) + offsetX;
      const y = r * Math.sin(angle) + offsetY;
      positions.push({ x, y });
    });
  
    return positions;
  };

  const calculateNodeSizes = () => {
    const nodeDegree: Record<string, number> = {};
  
    // Contamos las conexiones de cada nodo
    graphData.edges.forEach(edge => {
      nodeDegree[edge.source] = (nodeDegree[edge.source] || 0) + 1;
      nodeDegree[edge.target] = (nodeDegree[edge.target] || 0) + 1;
    });
  
    // Definimos tamaños mínimos y máximos
    const minSize = 10;
    const maxSize = 30;
    const degreeValues = Object.values(nodeDegree);
    
    if (degreeValues.length === 0) return [];
  
    const minDegree = Math.min(...degreeValues);
    const maxDegree = Math.max(...degreeValues);
  
    return graphData.nodes.map(node => {
      const degree = nodeDegree[node.id] || 0;
      
      // Normalizar tamaños entre minSize y maxSize
      const size = minSize + ((degree - minDegree) / (maxDegree - minDegree)) * (maxSize - minSize);
      
      return size || minSize; // Si no tiene enlaces, usa el tamaño mínimo
    });
  };
  
  const getPlotlyData = () => {
    const edgesTraces: Data[] = graphData.edges.map(edge => {
      const sourceIndex = graphData.nodes.findIndex(n => n.id === edge.source);
      const targetIndex = graphData.nodes.findIndex(n => n.id === edge.target);

      if (sourceIndex === -1 || targetIndex === -1) return null;

      const isHighlighted = hoveredNode !== null &&
        (edge.source === hoveredNode || edge.target === hoveredNode);
        
      return {
        type: 'scatter',
        x: [nodePositions[sourceIndex].x, nodePositions[targetIndex].x],
        y: [nodePositions[sourceIndex].y, nodePositions[targetIndex].y],
        mode: 'lines',
        line: {
          color: isHighlighted ? '#22C55E' : '#CBD5E1',
          width: isHighlighted ? 2 : 1
        },
        hoverinfo: 'none',
        showlegend: false,
      };
    }).filter(Boolean) as Data[];

    const connectedLocalNodes = hoveredNode
    ? graphData.edges
        .filter(edge => edge.source === hoveredNode || edge.target === hoveredNode)
        .map(edge => (edge.source === hoveredNode ? edge.target : edge.source))
    : [];

    const nodeTrace: Partial<ScatterData> = {
      type: 'scatter',
      x: nodePositions.map(pos => pos.x),
      y: nodePositions.map(pos => pos.y),
      mode: 'text+markers',
      marker: {
        size: calculateNodeSizes(),
        color: graphData.nodes.map(node => {
          if (hoveredNode === node.id || connectedLocalNodes.includes(node.id)) {
            return '#22C55E'; // Resaltar nodos conectados en verde
          }
          return node.type === NodeType.Topic ? '#E11D48' : '#4F46E5'; // Rojo para 'Topic', azul para el resto
        }),
      },
      text: graphData.nodes.map(node => node.label),
      textposition: 'bottom center',
      hoverinfo: 'text',
      hovertemplate: graphData.nodes.map(node => {
        if (node.id === hoveredNode) {
          //return `${node.label}<br>Conectado a: ${connectedLabels.join(', ')}<extra></extra>`;
        }
        return '%{text}<extra></extra>';
      }),
    };

    return [...edgesTraces, nodeTrace];
  };

  const getConnectedNodes = (nodeId: string) => {
    // Buscar todos los nodos conectados al nodo actual
    return graphData.edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => (edge.source === nodeId ? edge.target : edge.source))
      .map(targetId => {
        const node = graphData.nodes.find(n => n.id === targetId);
        return node ? node.label : null;
      })
      .filter(label => label !== null);
  };

  const getNodeData = (nodeId: string) => {
    // Buscar todos los nodos conectados al nodo actual
    return graphData.edges
      .find(edge => edge.source === nodeId || edge.target === nodeId);
  };
  
  const handleHover = (event: any) => {
    if (event.points && event.points[0]) {
      const pointIndex = event.points[0].pointIndex;
      if (typeof pointIndex === 'number') {
        const nodeId = graphData.nodes[pointIndex].id;
        setHoveredNode(nodeId);
      }
    }
  };

  return (
    <>

      <HoverCard
        hoveredNode={hoveredNode}
        connectedTopics={connectedTopics}
      />
      <div
        style={{
          width: '100%',
          height: '800px',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '1rem',
        }}
      >
        <Plot
          data={getPlotlyData()}
          layout={layout}
          config={{
            displayModeBar: true,
            scrollZoom: true, // Permitir zoom con el mouse
            responsive: true,
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
          onHover={handleHover}
          onUnhover={() => {
            setHoveredNode(null);
            //nodeTrace.hovertemplate = '%{text}<extra></extra>';
          }}
          onRelayout={(newLayout) => {
            // Guardar el estado del zoom y pan al hacer hover
            setLayout((prevLayout) => ({
              ...prevLayout,
              ...newLayout,
            }));
          }}
        />
      </div>
    </>
  );
};

export default TopicGraph;
