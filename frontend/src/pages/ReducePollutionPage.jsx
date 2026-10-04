import Headline from '../components/Headline.jsx';

const TIPS = [
  {
    title: 'Traffic emissions',
    color: 'var(--red)',
    points: [
      'Use public transport, carpool, or cycle for short trips',
      'Keep your vehicle serviced — poor maintenance increases emissions',
      'Avoid unnecessary engine idling at signals',
      'Support/use EV or CNG vehicles where possible',
    ],
  },
  {
    title: 'Construction dust',
    color: 'var(--amber)',
    points: [
      'Construction sites should use water spraying to settle dust',
      'Cover sand/debris piles with tarpaulin',
      'Use dust barriers/screens around active sites',
      'Avoid outdoor exercise near ongoing construction',
    ],
  },
  {
    title: 'Industrial activity',
    color: 'var(--cyan)',
    points: [
      'Report unusual smoke/odor to TNPCB via the Authorities page',
      'Support facilities using emission-control equipment',
      'Industries should conduct regular stack emission audits',
    ],
  },
  {
    title: 'Open burning',
    color: 'var(--teal)',
    points: [
      'Never burn leaves, plastic, or household waste openly',
      'Use municipal waste collection instead',
      'Report open burning incidents to local authorities',
    ],
  },
  {
    title: 'Personal health precautions',
    color: '#9bb8be',
    points: [
      'Check the AQI before outdoor activity — avoid exertion above 200',
      'Wear an N95 mask outdoors on high-pollution days',
      'Keep windows closed and use an air purifier indoors if AQI is poor',
      'Keep children and elderly indoors during severe pollution days',
    ],
  },
];

export default function ReducePollutionPage() {
  return (
    <>
      <Headline eyebrow="Guide" title="How to reduce pollution" subtitle="Action tips by source, and how to protect yourself" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {TIPS.map((group) => (
          <div className="card panel" key={group.title}>
            <div className="cardtitle" style={{ color: group.color }}>
              {group.title}
            </div>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.7 }}>
              {group.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
