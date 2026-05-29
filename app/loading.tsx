export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <span className="route-loading__bar" />
    </div>
  );
}
