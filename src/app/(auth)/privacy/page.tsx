export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 9, 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-sm">
        <section>
          <h2 className="text-lg font-semibold">1. Data We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> Email, name, and profile information provided during registration.</li>
            <li><strong>Social media tokens:</strong> OAuth access and refresh tokens for connected platforms (LinkedIn, Threads, Bluesky).</li>
            <li><strong>Content data:</strong> Posts you create, schedule, or import through the Service.</li>
            <li><strong>Analytics data:</strong> Engagement metrics (likes, comments, reposts) fetched from connected platforms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Token Security</h2>
          <p>
            All social media OAuth tokens are encrypted at rest using AES-256-GCM encryption before storage
            in our database. Tokens are only decrypted server-side when needed to execute authorized actions
            (publishing, analytics fetching). Tokens are never exposed to the browser or client-side code.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. AI Processing</h2>
          <p>
            If you enable the &quot;AI Rewrite&quot; feature, your post content is sent to Google Gemini API for
            semantic rewriting. We do not use your content to train AI models. Google&apos;s Gemini API processes
            data according to their own privacy policy and data processing agreements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Your Rights (GDPR / CCPA)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Right to access:</strong> You can view all your stored data in your dashboard.</li>
            <li><strong>Right to deletion:</strong> You can delete your account and all associated data at any time. We will delete all personal data, tokens, and content within 30 days.</li>
            <li><strong>Right to withdraw consent:</strong> You can disable Survival Mode and revoke auto-publishing consent at any time from Settings.</li>
            <li><strong>Right to data portability:</strong> You can export your post data from the dashboard.</li>
            <li><strong>Right to disconnect:</strong> You can disconnect any social media account at any time, which immediately revokes our access.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. Upon account deletion, all data
            (including encrypted tokens, posts, analytics, and profile information) is permanently deleted
            within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Third-Party Services</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase:</strong> Database and authentication (PostgreSQL, hosted in AWS).</li>
            <li><strong>Vercel:</strong> Application hosting and serverless functions.</li>
            <li><strong>Google Gemini:</strong> AI content rewriting (only when AI Rewrite is enabled).</li>
            <li><strong>Social platforms:</strong> LinkedIn, Threads, Bluesky APIs for publishing and analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Contact</h2>
          <p>
            For privacy-related inquiries or data deletion requests, contact us at: privacy@adaptivepace.com
          </p>
        </section>
      </div>
    </div>
  );
}
