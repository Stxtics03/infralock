import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data, color = '#3b82f6' }) {
  if (!data?.length) {
    return <div className="h-8 bg-gray-100 rounded" />;
  }
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
