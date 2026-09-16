import { useMemo } from "react";
import { version } from "../../package.json";
import { displayObservationTimestamp, latestObservationTimestamp } from "../lib/footerMetadata.js";

const PROJECT_URL = "https://github.com/oltapllana/Climate-Resilience-Dashboard";
const ISSUES_URL = `${PROJECT_URL}/issues`;

export default function InstitutionalFooter({ stations, t }) {
  const latest = useMemo(() => latestObservationTimestamp(stations), [stations]);
  return <footer className="institutional-footer">
    <div className="footer-brand">
      <img src="/favicon.svg" width="44" height="44" alt={t("footerProjectName")} />
      <div><strong>{t("footerProjectName")}</strong><span>{t("footerProject")}</span></div>
    </div>
    <dl>
      <div><dt>{t("footerOwner")}</dt><dd>{t("footerOwnerValue")}</dd></div>
      <div><dt>{t("footerSources")}</dt><dd>{t("footerSensorSource")}</dd></div>
      <div><dt>{t("footerMap")}</dt><dd>© <a href="https://www.openstreetmap.org/copyright">{t("footerMapCredit")}</a></dd></div>
      {latest && <div><dt>{t("footerLatestObservation")}</dt><dd><time dateTime={latest}>{displayObservationTimestamp(latest)}</time><br />{t("footerObservationScope")}</dd></div>}
      <div><dt>{t("footerContact")}</dt><dd><a href={ISSUES_URL} target="_blank" rel="noreferrer">{t("footerContactLink")}</a></dd></div>
      <div><dt>{t("footerFunding")}</dt><dd>{t("footerFundingValue")}</dd></div>
      <div><dt>{t("footerVersion")}</dt><dd>{version}</dd></div>
    </dl>
    <nav className="footer-links" aria-label={t("footerMethodology")}>
      <a href="#methodology">{t("footerMethodologyLink")}</a>
      <a href="#terms-and-licence">{t("footerTermsLink")}</a>
      <a href={PROJECT_URL} target="_blank" rel="noreferrer">GitHub</a>
    </nav>
    <div className="footer-disclosures">
      <details id="methodology"><summary>{t("footerMethodology")}</summary><p>{t("footerMethodologyText")}</p></details>
      <details id="terms-and-licence"><summary>{t("footerTerms")}</summary><p>{t("footerTermsText")}</p></details>
    </div>
  </footer>;
}
