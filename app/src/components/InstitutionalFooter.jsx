import { useMemo } from "react";
import { version } from "../../package.json";
import { displayObservationTimestamp, latestObservationTimestamp } from "../lib/footerMetadata.js";

const PROJECT_URL = "https://github.com/oltapllana/Climate-Resilience-Dashboard";
const ISSUES_URL = `${PROJECT_URL}/issues`;

export default function InstitutionalFooter({ stations, t }) {
  const latest = useMemo(() => latestObservationTimestamp(stations), [stations]);
  return <footer className="institutional-footer">
    <div className="footer-intro">
      <div className="footer-brand">
        <span className="footer-app-mark"><img src="/favicon.svg" width="52" height="52" alt="" /></span>
        <div>
          <span className="footer-eyebrow">{t("footerProject")}</span>
          <strong>{t("footerProjectName")}</strong>
          <p>{t("footerInstitutionNote")}</p>
        </div>
      </div>
      <div className="footer-institutions" role="list" aria-label={t("footerInstitutions")}>
        <article className="footer-institution" role="listitem">
          <a className="institution-logo-link" href="https://clipp.uni-pr.edu/" target="_blank" rel="noreferrer" aria-label={t("footerCippName")}>
            <img className="institution-logo institution-logo--clipp" src="/clipp-logo.png" width="174" height="187" alt="" loading="lazy" />
          </a>
          <div><small>{t("footerInitiativeRole")}</small><strong>{t("footerCippName")}</strong></div>
        </article>
        <article className="footer-institution" role="listitem">
          <a className="institution-logo-link" href="https://uni-pr.edu/" target="_blank" rel="noreferrer" aria-label={t("footerUniversityName")}>
            <img className="institution-logo institution-logo--up" src="/university-of-prishtina-logo.png" width="574" height="434" alt="" loading="lazy" />
          </a>
          <div><small>{t("footerAcademicRole")}</small><strong>{t("footerUniversityName")}</strong></div>
        </article>
      </div>
    </div>
    <dl className="footer-meta">
      <div><dt>{t("footerOwner")}</dt><dd>{t("footerOwnerValue")}</dd></div>
      <div><dt>{t("footerSources")}</dt><dd>{t("footerSensorSource")}</dd></div>
      <div><dt>{t("footerMap")}</dt><dd>© <a href="https://www.openstreetmap.org/copyright">{t("footerMapCredit")}</a></dd></div>
      {latest && <div><dt>{t("footerLatestObservation")}</dt><dd><time dateTime={latest}>{displayObservationTimestamp(latest)}</time><br />{t("footerObservationScope")}</dd></div>}
      <div><dt>{t("footerContact")}</dt><dd><a href={ISSUES_URL} target="_blank" rel="noreferrer">{t("footerContactLink")}</a></dd></div>
      <div><dt>{t("footerFunding")}</dt><dd>{t("footerFundingValue")}</dd></div>
      <div><dt>{t("footerVersion")}</dt><dd>{version}</dd></div>
    </dl>
    <nav className="footer-links" aria-label={t("footerMethodology")}>
      <a className="footer-link-primary" href="#methodology">{t("footerMethodologyLink")}</a>
      <a href="#terms-and-licence">{t("footerTermsLink")}</a>
      <a href={PROJECT_URL} target="_blank" rel="noreferrer">GitHub ↗</a>
    </nav>
    <div className="footer-disclosures">
      <details id="methodology"><summary>{t("footerMethodology")}</summary><p>{t("footerMethodologyText")}</p></details>
      <details id="terms-and-licence"><summary>{t("footerTerms")}</summary><p>{t("footerTermsText")}</p></details>
    </div>
  </footer>;
}
