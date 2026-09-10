export default function Toast({ message, visible }) {
  return (
    <div className={`toast${visible ? ' show' : ''}`}>
      <b>AirTrace AI</b>
      <br />
      {message}
    </div>
  );
}
