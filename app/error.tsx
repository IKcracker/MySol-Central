"use client";
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="loading-state">
      <h1>MySol Central</h1>
      <h2>The workspace could not be displayed.</h2>
      <p>
        Your saved browser data is retained. Try loading the workspace again.
      </p>
      <button className="button primary" onClick={retry}>
        Try again
      </button>
    </main>
  );
}
