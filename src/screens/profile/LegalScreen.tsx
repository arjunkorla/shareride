interface Props {
  type: 'terms' | 'privacy'
  onBack: () => void
}

const termsContent = `Last updated: 1 August 2026

1. ACCEPTANCE OF TERMS
By accessing or using the ShareRide application ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.

2. ELIGIBILITY
You must be at least 18 years of age and hold a valid government-issued ID to register as a user. Drivers must additionally hold a valid driving licence and vehicle registration.

3. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current and complete information. ShareRide reserves the right to suspend accounts for violations of these terms.

4. RIDE SHARING
ShareRide is a platform that connects drivers and passengers for shared transportation. We do not provide transportation services directly. Drivers and passengers enter into agreements directly with each other.

5. PAYMENTS
All payments processed through the platform are subject to our payment policy. Refunds for cancelled rides are governed by the cancellation policy detailed in Section 8.

6. SAFETY
All users must comply with our Community Safety Guidelines. We reserve the right to remove any user who poses a safety risk to others. SOS features and emergency contact sharing are provided as safety tools only.

7. VERIFICATION
Users who wish to drive must complete identity and vehicle verification. Verification is for platform safety only and does not constitute employment or endorsement.

8. CANCELLATION POLICY
Drivers: Cancellations within 2 hours of departure may affect your rating. Passengers: Cancellations within 1 hour of departure may forfeit the seat amount.

9. LIABILITY LIMITATION
ShareRide is not liable for any direct, indirect, incidental, special or consequential damages arising from use of the Service or from any rides arranged through the platform.

10. GOVERNING LAW
These Terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Mumbai, Maharashtra.

11. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Users will be notified of significant changes via the app. Continued use constitutes acceptance of the revised terms.

Contact us at legal@shareride.in for any questions regarding these Terms.`

const privacyContent = `Last updated: 1 August 2026

PRIVACY POLICY

1. INFORMATION WE COLLECT
We collect information you provide directly (name, email, phone, profile photo, ID documents), information collected automatically (location data, device info, usage analytics), and information from third parties (Google sign-in, payment processors).

2. HOW WE USE YOUR INFORMATION
• Matching drivers and passengers for ride sharing
• Verifying your identity for safety purposes
• Processing payments and managing your wallet
• Sending notifications about rides and account activity
• Improving our services and personalising your experience
• Complying with legal obligations

3. LOCATION DATA
We collect your precise location when the app is in use to show nearby rides and drivers. You can disable location access via device settings, but this will limit core app functionality.

4. SHARING YOUR INFORMATION
We share limited information with:
• Matched ride partners (name, photo, rating, vehicle info)
• Payment processors for transaction processing
• Identity verification providers
• Law enforcement when legally required

We do NOT sell your personal data to advertisers.

5. DATA SECURITY
All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We employ regular security audits and penetration testing. Document uploads are stored in isolated, access-controlled environments.

6. DATA RETENTION
Active account data is retained for the duration of your account. After deletion, most data is purged within 30 days. Financial records are retained for 7 years as required by Indian law.

7. YOUR RIGHTS
You have the right to: access your data, request corrections, request deletion, object to processing, and data portability. Contact privacy@shareride.in to exercise these rights.

8. COOKIES
We use essential cookies for session management and analytics cookies (with your consent) to improve the service.

9. CHILDREN'S PRIVACY
Our Service is not directed to individuals under 18. We do not knowingly collect data from minors.

10. CONTACT
Privacy Officer, ShareRide Technologies Pvt. Ltd.
privacy@shareride.in | +91 22 6800 0000`

export default function LegalScreen({ type, onBack }: Props) {
  const isTerms = type === 'terms'

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 border-b border-slate-100" style={{ paddingTop: 56, paddingBottom: 14 }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {isTerms ? 'Terms of Service' : 'Privacy Policy'}
        </h2>
        <span className="text-xs text-slate-400 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>v2.4</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-5">
        {/* Icon banner */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 mb-5"
          style={{ background: isTerms ? '#EFF6FF' : '#F0FDF4', border: `1px solid ${isTerms ? '#BFDBFE' : '#BBF7D0'}` }}
        >
          <span className="text-3xl">{isTerms ? '📋' : '🔒'}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: isTerms ? '#2563EB' : '#059669', fontFamily: "'Outfit', sans-serif" }}>
              {isTerms ? 'Terms of Service' : 'Privacy Policy'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: isTerms ? '#1E40AF' : '#047857', fontFamily: "'Inter', sans-serif" }}>
              {isTerms ? 'Rules governing your use of ShareRide' : 'How we collect, use and protect your data'}
            </p>
          </div>
        </div>

        {/* Legal text */}
        <div className="space-y-4 pb-8">
          {(isTerms ? termsContent : privacyContent).split('\n\n').map((para, i) => {
            const isHeading = /^\d+\.\s+[A-Z]/.test(para) || /^[A-Z\s]+$/.test(para.split('\n')[0])
            return (
              <div key={i}>
                {isHeading ? (
                  <h3 className="text-sm font-bold text-slate-800 mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {para}
                  </h3>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {para}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
