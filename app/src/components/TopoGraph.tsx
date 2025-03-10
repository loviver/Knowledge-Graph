import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { uniqBy } from 'lodash';
import { Data, ScatterData, Layout } from 'plotly.js';
import { Node, Edge, GraphData, NodeType } from '../types/graph';
import { HoverCard } from './HoverCard';

interface TopicGraphProps {
  data: GraphData;
}

const TopicGraph: React.FC<TopicGraphProps> = ({ data }) => {
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
      let nodes = uniqBy(data.nodes, 'id').map(node => ({ ...node, type: NodeType.Topic }));
      let edges = data.edges;

      setGraphData({ nodes, edges });

      // Generar posiciones una sola vez con más separación
      setNodePositions(calculateNodePositions(nodes.length));
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
  
  // setConnectedTopics(connectedLabels);
  const calculateNodePositions = (nodeCount: number) => {
    const positions = [];
    const radius = 10; // Mayor separación
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI;
      positions.push({
        x: radius * Math.cos(angle) + (Math.random() * 4 - 2), // Más dispersión
        y: radius * Math.sin(angle) + (Math.random() * 4 - 2)
      });
    }

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
        color: graphData.nodes.map(node =>
          hoveredNode === node.id || connectedLocalNodes.includes(node.id)
            ? '#22C55E' // Resaltar nodos conectados en verde
            : '#4F46E5'
        ),
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
