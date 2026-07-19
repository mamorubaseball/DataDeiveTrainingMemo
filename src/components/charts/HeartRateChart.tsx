import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;
const chartHeight = 120;
const chartWidth = screenWidth - 60; // Padding subtracted

export const HeartRateChart: React.FC = () => {
  // Dummy heartbeat data points (x, y) scaled to SVG coords
  // x: 0 to chartWidth, y: 0 to chartHeight (higher value = lower y in SVG coords)
  // Let's create an elegant wave representing heart rate (60bpm to 160bpm)
  const data = [
    { x: 0, val: 70 },
    { x: 0.15, val: 95 },
    { x: 0.3, val: 145 },
    { x: 0.45, val: 120 },
    { x: 0.6, val: 155 },
    { x: 0.75, val: 110 },
    { x: 0.9, val: 165 },
    { x: 1.0, val: 85 },
  ];

  const points = data.map(p => ({
    x: p.x * chartWidth,
    y: chartHeight - ((p.val - 60) / 110) * (chartHeight - 20) - 10
  }));

  // Build SVG path string with cubic bezier curves for smooth lines
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  // Build the closed path for the gradient fill
  const fillPathD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>心拍数推移</Text>
        <Text style={styles.chartValue}>平均 128 bpm (最高 165)</Text>
      </View>
      
      <Svg height={chartHeight} width={chartWidth}>
        <Defs>
          <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ff6b00" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#ff6b00" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid Lines */}
        <Line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
        <Line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} stroke="rgba(255,255,255,0.05)" />

        {/* Gradient Fill Under Curve */}
        <Path d={fillPathD} fill="url(#glow)" />

        {/* Heart Rate Line */}
        <Path
          d={pathD}
          fill="none"
          stroke="#ff6b00"
          strokeWidth="3"
        />
      </Svg>

      <View style={styles.labels}>
        <Text style={styles.labelText}>10分</Text>
        <Text style={styles.labelText}>20分</Text>
        <Text style={styles.labelText}>30分</Text>
        <Text style={styles.labelText}>40分</Text>
        <Text style={styles.labelText}>50分</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartValue: {
    color: '#ff6b00',
    fontSize: 12,
    fontWeight: '600',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 5,
  },
  labelText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
export default HeartRateChart;
