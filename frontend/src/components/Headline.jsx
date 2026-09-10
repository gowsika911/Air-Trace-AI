export default function Headline({
  eyebrow = 'Urban pollution intelligence',
  title = 'Find the cause. Target the response.',
  subtitle = 'Multi-pollutant source attribution across 4 monitoring zones',
}) {
  return (
    <section className="headline">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      <p>{subtitle}</p>
    </section>
  );
}
