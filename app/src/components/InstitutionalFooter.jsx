import { useMemo } from "react";
import { version } from "../../package.json";
import { displayObservationTimestamp, latestObservationTimestamp } from "../lib/footerMetadata.js";

const PROJECT_URL = "https://github.com/oltapllana/Climate-Resilience-Dashboard";
const ISSUES_URL = `${PROJECT_URL}/issues`;
const OSM_LICENCE_URL = "https://www.openstreetmap.org/copyright";

// Logos sit in their own labelled strip rather than beside the project name:
// a reader looks for "who is behind this" as a group, and a funder logo mixed
// into the brand line reads as co-branding the platform itself.
const INSTITUTIONS = [
  { key: "clipp", href: "https://clipp.uni-pr.edu/", name: "footerCippName", role: "footerInitiativeRole", logo: "/clipp-logo.png", width: 174, height: 187 },
  { key: "up", href: "https://uni-pr.edu/", name: "footerUniversityName", role: "footerAcademicRole", logo: "/university-of-prishtina-logo.png", width: 574, height: 434 },
];

export default function InstitutionalFooter({ stations, t }) {
  const latest = useMemo(() => latestObservationTimestamp(stations), [stations]);
  const year = String(new Date().getFullYear());

  return <footer className="institutional-footer">
    {/* Band 1 — who publishes this, and how current it is. Data freshness is
        the one fact a monitoring platform is judged on, so it is stated here
        rather than buried among the attribution rows. */}
    <div className="footer-masthead">
      <div className="footer-brand">
        <span className="footer-app-mark"><img src="/favicon.svg" width="52" height="52" alt="" /></span>
        <div>
          <span className="footer-eyebrow">{t("footerProject")}</span>
          <strong>{t("footerProjectName")}</strong>
          <p>{t("footerInstitutionNote")}</p>
        </div>
      </div>
      {latest && <dl className="footer-freshness">
        <dt>{t("footerLatestObservation")}</dt>
        <dd><time dateTime={latest}>{displayObservationTimestamp(latest)}</time></dd>
        <dd className="footer-freshness-scope">{t("footerObservationScope")}</dd>
      </dl>}
    </div>

    {/* Band 2 — the conventional four columns: what this is, where the data
        comes from, who answers for it, and how to reach someone. */}
    <div className="footer-columns">
      <nav className="footer-column" aria-labelledby="footer-col-about">
        <h2 id="footer-col-about">{t("footerColumnAbout")}</h2>
        <ul role="list">
          <li><a href="#methodology">{t("footerMethodologyLink")}</a></li>
          <li><a href="#accessibility">{t("footerAccessibilityLink")}</a></li>
          <li><a href={PROJECT_URL} target="_blank" rel="noreferrer">{t("footerSourceCodeLink")}</a></li>
        </ul>
      </nav>

      <section className="footer-column" aria-labelledby="footer-col-data">
        <h2 id="footer-col-data">{t("footerColumnData")}</h2>
        <dl>
          <dt>{t("footerSources")}</dt>
          <dd>{t("footerSensorSource")}</dd>
          <dt>{t("footerMap")}</dt>
          <dd>© <a href={OSM_LICENCE_URL} target="_blank" rel="noreferrer">{t("footerMapCredit")}</a></dd>
        </dl>
      </section>

      <section className="footer-column" aria-labelledby="footer-col-governance">
        <h2 id="footer-col-governance">{t("footerColumnGovernance")}</h2>
        <dl>
          <dt>{t("footerOwner")}</dt>
          <dd>{t("footerOwnerValue")}</dd>
          <dt>{t("footerFunding")}</dt>
          <dd>{t("footerFundingValue")}</dd>
        </dl>
      </section>

      <nav className="footer-column" aria-labelledby="footer-col-contact">
        <h2 id="footer-col-contact">{t("footerContact")}</h2>
        <ul role="list">
          <li><a href={ISSUES_URL} target="_blank" rel="noreferrer">{t("footerContactLink")}</a></li>
          <li><a href="#terms-and-licence">{t("footerTermsLink")}</a></li>
        </ul>
      </nav>
    </div>

    {/* Band 3 — responsible institutions. */}
    <div className="footer-partners">
      <h2>{t("footerInstitutions")}</h2>
      <ul className="footer-partner-list" role="list">
        {INSTITUTIONS.map((institution) => (
          <li key={institution.key} className="footer-institution">
            <a className="institution-logo-link" href={institution.href} target="_blank" rel="noreferrer" aria-label={t(institution.name)}>
              <img className={`institution-logo institution-logo--${institution.key}`} src={institution.logo} width={institution.width} height={institution.height} alt="" loading="lazy" />
            </a>
            <div><small>{t(institution.role)}</small><strong>{t(institution.name)}</strong></div>
          </li>
        ))}
      </ul>
    </div>

    {/* Band 4 — the long-form statements the column links point at, kept on
        the page so a shared link lands on the text rather than a missing page. */}
    <div className="footer-disclosures">
      <details id="methodology"><summary>{t("footerMethodology")}</summary><p>{t("footerMethodologyText")}</p></details>
      <details id="terms-and-licence"><summary>{t("footerTerms")}</summary><p>{t("footerTermsText")}</p></details>
      <details id="accessibility"><summary>{t("footerAccessibility")}</summary><p>{t("footerAccessibilityText")}</p></details>
    </div>

    {/* Band 5 — the thin legal baseline every institutional site closes on. */}
    <div className="footer-baseline">
      <p className="footer-copyright">{t("footerCopyright", { year, owner: t("footerCippName") })}</p>
      <dl className="footer-version"><dt>{t("footerVersion")}</dt><dd>{version}</dd></dl>
    </div>
  </footer>;
}
