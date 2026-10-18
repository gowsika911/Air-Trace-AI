export default function InfoBanner() {
  return (
    <div className="infobanner">
      <div className="icon">i</div>
      <p>
        <b>How it works:</b> the pollution source is predicted by a <b>Random Forest</b> model
        (100 decision trees) from PM2.5, PM10, NO₂, SO₂, CO and the PM10/PM2.5 ratio. The model
        is trained on <b>simulated data</b> to demonstrate the ML pipeline, so its accuracy
        figures do not describe real-world performance. Our base research reports 96.9% on real
        industry-emission data in Korea, which is a different task and dataset. Next step: train
        on real, labelled source data. If the model is unavailable, the app falls back to
        rule-based scoring.
      </p>
    </div>
  );
}
