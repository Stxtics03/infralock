import PageLayout from '../components/PageLayout';
import SecuritySettings from '../components/SecuritySettings';

export default function Settings() {
  return (
    <PageLayout
      eyebrow="Account"
      title="Settings"
      subtitle="Manage authentication and security preferences"
    >
      <div style={{ maxWidth: 640 }}>
        <SecuritySettings />
      </div>
    </PageLayout>
  );
}
