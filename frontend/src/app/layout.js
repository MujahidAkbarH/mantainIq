import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'MaintainIQ | AI-Powered QR Maintenance & Asset History Platform',
  description: 'Streamline asset tracking, maintenance workflows, and public issue reporting with AI-assisted triage and dynamic QR verification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ flex: 1 }}>{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
