/**
 * Email: Verificación de Correo Electrónico
 */

import React from 'react';
import {
  Section,
  Row,
  Column,
  Text,
  Button,
  Heading,
  Hr,
} from '@react-email/components';
import { EmailLayout } from './email-layout';

export interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
  expiresIn?: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  userName,
  verificationUrl,
  expiresIn = '24 horas',
}) => {
  return (
    <EmailLayout
      title="Verifica tu correo electrónico"
      previewText="Por favor, verifica tu correo para completar el registro"
    >
      <Heading style={headingStyles}>Bienvenido a RENRI</Heading>

      <Text style={textStyles}>
        Hola {userName},
      </Text>

      <Text style={textStyles}>
        Gracias por registrarte. Para completar el registro, necesitas verificar tu correo electrónico.
      </Text>

      <Section style={ctaBoxStyles}>
        <Text style={ctaTextStyles}>
          Este enlace expira en <strong>{expiresIn}</strong>
        </Text>
        <Button
          href={verificationUrl}
          style={primaryButtonStyles}
        >
          Verificar Correo
        </Button>
      </Section>

      <Hr style={hrStyles} />

      <Text style={altInstructionsStyles}>
        O copia y pega este enlace en tu navegador:
      </Text>
      <Text style={linkStyles}>{verificationUrl}</Text>

      <Hr style={hrStyles} />

      <Text style={footerMessageStyles}>
        Si no solicitaste crear una cuenta, ignora este correo.
      </Text>
    </EmailLayout>
  );
};

const headingStyles: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  color: '#000',
};

const textStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '12px 0',
  lineHeight: '1.5',
};

const ctaBoxStyles: React.CSSProperties = {
  backgroundColor: '#f0f9ff',
  borderRadius: '6px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #bfdbfe',
};

const ctaTextStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#0066cc',
  margin: '0 0 12px 0',
  fontWeight: '500',
};

const primaryButtonStyles: React.CSSProperties = {
  backgroundColor: '#0066cc',
  color: 'white',
  padding: '12px 32px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  border: 'none',
  display: 'inline-block',
};

const hrStyles: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
};

const altInstructionsStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  margin: '12px 0 4px 0',
};

const linkStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#0066cc',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f5f5f5',
  padding: '8px 12px',
  borderRadius: '4px',
  display: 'block',
  margin: '0 0 12px 0',
  fontFamily: 'monospace',
};

const footerMessageStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  fontStyle: 'italic',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};
