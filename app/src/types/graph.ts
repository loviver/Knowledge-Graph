export interface TopicData {
  [key: string]: string[];
}

export interface Node {
  id: string;
  label: string;
  type: 'topic' | 'subtopic';
}

export interface Edge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export enum NodeType {
  Topic = 'topic',
  Subtopic = 'subtopic',
}