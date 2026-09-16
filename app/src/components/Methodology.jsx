export default function Methodology({ t, children }) {
  return (
    <details className="chart-methodology">
      <summary>{t("methodologyAndLimitations")}</summary>
      <div>{children}</div>
    </details>
  );
}
