const colours = {
  critical: 'bg-red-100 text-red-800 border border-red-300',
  medium:   'bg-amber-100 text-amber-800 border border-amber-300',
  low:      'bg-blue-100 text-blue-800 border border-blue-300',
};

export default function AnomalySeverityBadge({ severity }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colours[severity] ?? colours.low}`}>
      {severity}
    </span>
  );
}