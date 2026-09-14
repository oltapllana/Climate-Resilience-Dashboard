import { useMemo } from "react";
import { version } from "../../package.json";
import { latestObservationDate } from "../lib/footerMetadata.js";

export default function InstitutionalFooter({ stations, t }) {
  const latest = useMemo(() => latestObservationDate(stations), [stations]);
  return <footer className="institutional-footer">
    <dl>
      <div><dt>{t("footerSources")}</dt><dd>{t("footerSensorSource")}</dd></div>
      <div><dt>{t("footerMap")}</dt><dd>© <a href="https://www.openstreetmap.org/copyright">{t("footerMapCredit")}</a></dd></div>
      {latest && <div><dt>{t("footerLatestObservation")}</dt><dd><time dateTime={latest}>{latest}</time><br />{t("footerObservationScope")}</dd></div>}
      <div><dt>{t("footerVersion")}</dt><dd>{version}</dd></div>
    </dl>
  </footer>;
}
