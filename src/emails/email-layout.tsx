/**
 * Email Layout Base - Plantilla reutilizable para todos los emails
 */

import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Img,
  Hr,
  Font,
} from 'react-email';

interface EmailLayoutProps {
  title: string;
  children: React.ReactNode;
  previewText?: string;
  footerText?: string;
  unsubscribeUrl?: string;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  title,
  children,
  previewText,
  footerText = 'RENRI - Sistema de Gestión de Servicios',
  unsubscribeUrl,
}) => {
  return (
    <Html lang="es">
      <Head>
        <Font
          fontFamily="Geist"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
        />
        <title>{title}</title>
      </Head>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header con logo */}
          <Section style={styles.header}>
            <Row>
              <Column align="center">
                <Img
                  src="https://your-domain.com/logo.png"
                  alt="RENRI"
                  width={40}
                  height={40}
                  style={styles.logo}
                />
                <Text style={styles.headerTitle}>RENRI</Text>
              </Column>
            </Row>
          </Section>

          {/* Contenido principal */}
          <Section style={styles.content}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{footerText}</Text>
            {unsubscribeUrl && (
              <Text style={styles.unsubscribeText}>
                <Link href={unsubscribeUrl} style={styles.unsubscribeLink}>
                  Darse de baja
                </Link>
              </Text>
            )}
            <Text style={styles.copyright}>
              © {new Date().getFullYear()} RENRI. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f5f5f5',
    fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    marginTop: '20px',
    marginBottom: '20px',
    maxWidth: '600px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden' as const,
  },
  header: {
    backgroundColor: '#f8f8f8',
    padding: '24px 0',
    borderBottom: '1px solid #e5e5e5',
  },
  logo: {
    margin: '0 auto',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000',
    margin: '12px 0 0',
  },
  content: {
    padding: '32px 24px',
  },
  footer: {
    backgroundColor: '#fafafa',
    padding: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#666',
    fontSize: '12px',
    margin: '0',
  },
  unsubscribeText: {
    color: '#999',
    fontSize: '11px',
    margin: '8px 0 0',
  },
  unsubscribeLink: {
    color: '#0066cc',
    textDecoration: 'underline',
  },
  copyright: {
    color: '#999',
    fontSize: '11px',
    margin: '8px 0 0',
  },
  hr: {
    borderColor: '#e5e5e5',
    margin: '0',
  },
};
