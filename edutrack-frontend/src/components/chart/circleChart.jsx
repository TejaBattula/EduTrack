import React from 'react';
import '../chart/circleChart.css';

const CircularProgress = ({ percentage, totalMarksObtained, totalMaxMarks }) => {
  const radius = 60;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let gradeText = 'Needs Improvement';
  let gradeColor = '#ef4444';

  if (percentage >= 80) {
    gradeText = 'Excellent';
    gradeColor = '#10b981';
  } else if (percentage >= 65) {
    gradeText = 'Good';
    gradeColor = '#4f46e5';
  } else if (percentage >= 50) {
    gradeText = 'Average';
    gradeColor = '#f59e0b';
  }

  return (
    <div className="circular-progress-container">
      <div className="circular-progress-ring-wrapper" style={{ width: radius * 2, height: radius * 2 ,}}>
        <svg height={radius * 2} width={radius * 2} className="circular-progress-svg">
          {/* Background circle */}
          <circle
            stroke="lightgray"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <text
  x={radius}
  y={radius}
  textAnchor="middle"
  dominantBaseline="middle"
  fontSize="20"
  fontWeight="bold"
  fill="black"
  transform={`rotate(90 ${radius} ${radius})`}
>
  {Number(percentage).toFixed(2)}%
</text>
          
          <circle
            stroke={gradeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            className="circular-progress-ring-circle"
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        
      </div>

      {/* Grade Text & Marks Summary */}
      <div className="circular-progress-summary">
        <span
          className="circular-progress-badge"
          style={{
            backgroundColor: `${gradeColor}20`,
            color: gradeColor,
            border: `1px solid ${gradeColor}40`
          }}
        >
          {gradeText}
        </span>
        <p className="circular-progress-marks">
          {totalMarksObtained} / {totalMaxMarks} Marks Obtained
        </p>
      </div>
    </div>
  );
};

export default CircularProgress;
