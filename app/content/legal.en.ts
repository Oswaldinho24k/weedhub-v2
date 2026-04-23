/**
 * English legal draft. AI-assisted. Review before launch.
 * TODO(legal-en): Lawyer review. Consider CCPA/US state-specific requirements.
 */
import { LEGAL_COMPANY, type LegalSection } from "./legal.es";

export { LEGAL_COMPANY };

export const TERMS_SECTIONS_EN: LegalSection[] = [
  {
    heading: "1. What WeedHub is",
    body:
      "WeedHub is an editorial and community platform for informed discussion about cannabis. We offer a strain directory, context-rich user reviews, and editorial content. We don't sell, distribute, or facilitate the purchase of cannabis or any related product.",
  },
  {
    heading: "2. Age and responsible use",
    body:
      "You must be at least 18 (or the age of majority in your jurisdiction, whichever is higher) to create an account. WeedHub does not promote consumption. Information published is for educational and community purposes — not a substitute for medical, legal, or professional advice.",
  },
  {
    heading: "3. Your account",
    body:
      "You are responsible for keeping your account secure and for all activities under it. Notify us immediately if you suspect unauthorized access. We can suspend or remove accounts that violate these terms, especially for harassment, spam, or impersonation.",
  },
  {
    heading: "4. User-generated content",
    body:
      "When you publish a review, comment, or photo on WeedHub, you grant us a non-exclusive, worldwide, royalty-free license to display, reproduce, and distribute it within the service. You retain ownership. You can request removal at any time from your profile.",
  },
  {
    heading: "5. What's not allowed",
    body:
      "Explicitly prohibited: content facilitating the sale of controlled substances; paid reviews without disclosure; hate speech, harassment, or threats; content about minors consuming; impersonation; reverse engineering or automated scraping without authorization.",
  },
  {
    heading: "6. Moderation",
    body:
      "We review flagged content from the community. We can remove content that violates these terms without prior notice. If you think a removal was wrong, email " +
      LEGAL_COMPANY.contactEmail +
      ".",
  },
  {
    heading: "7. Service availability",
    body:
      "We make reasonable efforts to keep WeedHub available, but don't guarantee uninterrupted service. We may modify or discontinue features with reasonable notice.",
  },
  {
    heading: "8. Intellectual property",
    body:
      "WeedHub's design, brand, visual tokens, and proprietary code are owned by " +
      LEGAL_COMPANY.name +
      ". Common strain names (Blue Dream, OG Kush, etc.) are documented for informational purposes; this doesn't imply endorsement of any producer.",
  },
  {
    heading: "9. Limitation of liability",
    body:
      "To the maximum extent permitted by law, WeedHub isn't liable for indirect damages arising from use of published information. Always consult a professional before making health decisions.",
  },
  {
    heading: "10. Changes to these terms",
    body:
      "We may update these terms. When changes are material, we'll notify you by email or within the platform at least 15 days in advance. If you continue using WeedHub after the effective date, you accept the new terms.",
  },
  {
    heading: "11. Jurisdiction",
    body:
      "These terms are governed by the laws of " +
      LEGAL_COMPANY.country +
      ". Any dispute will be resolved in the competent courts of that jurisdiction.",
  },
  {
    heading: "12. Contact",
    body:
      "Email " +
      LEGAL_COMPANY.contactEmail +
      " for any question about these terms.",
  },
];

export const PRIVACY_SECTIONS_EN: LegalSection[] = [
  {
    heading: "1. What data we collect",
    body:
      "On account creation: email and public name. During service use: your reviews, saved strains, helpful votes, and cannabis preferences you choose to share (experience level, preferred effects, method). Technical: IP address, browser type, visit date and time, in server logs kept for 30 days.",
  },
  {
    heading: "2. What we use it for",
    body:
      "To operate the service (authenticate you, show relevant content, compute your badges), communicate with you (security notices, service changes), and improve WeedHub (aggregate analytics without identifying you). We don't sell your data to third parties.",
  },
  {
    heading: "3. Legal bases (where applicable)",
    body:
      "We process your data based on: (a) contract performance you accept by using the service, (b) your explicit consent for newsletter and optional cookies, and (c) legitimate interest in maintaining service security and preventing abuse. US CCPA and EU GDPR provisions apply to users in those jurisdictions.",
  },
  {
    heading: "4. Who we share data with",
    body:
      "Infrastructure providers under data processing agreements: MongoDB Atlas (database), Cloudinary (images), Resend (transactional and newsletter email). We don't share your data with advertisers or data brokers.",
  },
  {
    heading: "5. Cookies and similar technologies",
    body:
      "We use a session cookie (__weedhub_session) to keep you logged in and a preference cookie (wh:theme) to remember your theme. Neither is for advertising. If we later add analytics, we'll request prior consent.",
  },
  {
    heading: "6. Your rights",
    body:
      "You can access, correct, or delete your data at any time from your profile, or by writing to " +
      LEGAL_COMPANY.contactEmail +
      ". If you reside in the EU, UK, California, Mexico, Brazil, or another jurisdiction with specific protections, you also have the right to portability, objection, and to lodge a complaint with your data protection authority.",
  },
  {
    heading: "7. Retention",
    body:
      "We keep your account data while your account exists. When you delete your account, we erase identifiable information within 30 days, except what we must retain for legal obligations or dispute resolution. Published reviews may remain anonymized.",
  },
  {
    heading: "8. Minors",
    body:
      "WeedHub is for adults only. We don't knowingly collect data from minors. If we discover a minor created an account, we'll remove it.",
  },
  {
    heading: "9. International transfers",
    body:
      "Your data may be processed outside your country of residence (e.g., US or European servers). We use standard contractual clauses and providers with recognized certifications to protect those transfers.",
  },
  {
    heading: "10. Changes to this policy",
    body:
      "We'll post any update to this page and, for material changes, notify you at least 15 days in advance.",
  },
  {
    heading: "11. Contact",
    body:
      "To exercise any right or question: " +
      LEGAL_COMPANY.contactEmail +
      ". We respond within 15 business days.",
  },
];
