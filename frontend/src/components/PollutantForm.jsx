const FIELDS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³' },
  { key: 'co', label: 'CO', unit: 'mg/m³' },
];

export default function PollutantForm({ values, onChange, onSubmit, submitting }) {
  return (
    <div className="card panel">
      <div className="cardtitle">Try a pollutant profile</div>
      <div className="sub">Change inputs to simulate the classifier</div>

      <div className="inputs">
        {FIELDS.map(({ key, label, unit }) => (
          <div className="input" key={key}>
            <label>
              {label} <span className="unit">{unit}</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={values[key]}
              onChange={(event) => onChange(key, event.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="predict" onClick={onSubmit} disabled={submitting}>
        {submitting ? 'Analysing pollution pattern…' : 'Run source analysis →'}
      </button>
    </div>
  );
}
