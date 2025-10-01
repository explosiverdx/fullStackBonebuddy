import React from 'react';

const ProgressChart = ({ data, labels, title }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">No data available for chart.</p>;
  }

  const maxDataValue = Math.max(...data);
  const minDataValue = Math.min(...data);

  const width = 300;
  const height = 150;
  const padding = 30;
  const fontSize = 9;

  const points = data.map((value, index) => {
    const x = padding + (index * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - ((value - minDataValue) * (height - 2 * padding)) / (maxDataValue - minDataValue);
    return [x, y];
  });

  const pathData = points.reduce((acc, point, i) => {
    return i === 0 ? `M${point[0]},${point[1]}` : `${acc} L${point[0]},${point[1]}`;
  }, '');

  return (
    <div className="relative w-full" style={{ paddingBottom: '50%' }}>
      <h3 className="text-center font-semibold mb-2 text-sm sm:text-base">{title}</h3>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-w-full border rounded bg-white shadow-sm"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* X and Y axis */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" strokeWidth="1" />

          {/* Data line */}
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Data points */}
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="#2563eb" />
          ))}

          {/* Labels */}
          {labels && labels.map((label, i) => {
            const x = padding + (i * (width - 2 * padding)) / (labels.length - 1);
            return (
              <text
                key={i}
                x={x}
                y={height - padding + 15}
                fontSize={fontSize}
                textAnchor="middle"
                fill="#666"
                className="text-xs"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ProgressChart;
