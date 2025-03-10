import React from 'react';

interface HoverCardProps {
  hoveredNode: string | null;
  connectedTopics: string[];
}

export function HoverCard({ hoveredNode, connectedTopics }: HoverCardProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      width: '18rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid rgb(243, 244, 246)',
      overflow: 'hidden',
      transition: 'all 300ms ease-in-out',
      opacity: hoveredNode ? '1' : '0',
      transform: hoveredNode ? 'translateY(0)' : 'translateY(-0.5rem)',
      pointerEvents: hoveredNode ? 'auto' : 'none'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
        padding: '0.75rem 1rem'
      }}>
        <h3 style={{
          color: 'white',
          fontWeight: '500',
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {hoveredNode ? `${hoveredNode}` : 'Connected Node'}
        </h3>
      </div>

      {/* Content */}
      <div style={{
        padding: '1rem',
        maxHeight: '800px',
        overflowY: 'auto'
      }}>
        {hoveredNode ? (
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {connectedTopics.length > 0 ? (
              connectedTopics.map((node, index) => (
                <li 
                  key={index}
                  style={{
                    color: 'rgb(55, 65, 81)',
                    wordBreak: 'break-word',
                    borderRadius: '0.25rem',
                    backgroundColor: 'rgb(249, 250, 251)',
                    padding: '0.5rem',
                    transition: 'background-color 150ms ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)';
                  }}
                >
                  {node}
                </li>
              ))
            ) : (
              <li style={{
                color: 'rgb(107, 114, 128)',
                fontStyle: 'italic'
              }}>
                No connected nodes
              </li>
            )}
          </ul>
        ) : (
          <p style={{
            color: 'rgb(75, 85, 99)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Hover over a node to see its connections.
          </p>
        )}
      </div>
    </div>
  );
}