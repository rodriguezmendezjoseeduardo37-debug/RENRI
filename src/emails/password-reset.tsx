/**
 * Email: Reseteo de Contraseña
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
} from 'react-email';
import { EmailLayout } from './email-layout';

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
  ipAddress?: string;
  timestamp?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName,
  resetUrl,
  expiresIn = '1 hora',
  ipAddress,
  timestamp,
}) => {
  return (
    <EmailLayout
      title="Resetea tu contraseña"
      previewText="Se solicitó un reseteo de contraseña para tu cuenta"
    >
      <Heading style={headingStyles}>Resetea tu Contraseña</Heading>

      <Text style={textStyles}>
        Hola {userName},
      </Text>

      <Text style={textStyles}>
        Recibimos una solicitud para resetear la contraseña de tu cuenta RENRI.
      </Text>

      <Section style={warningBoxStyles}>
        <Text style={warningTextStyles}>
          ⚠️ Este enlace expira en <strong>{expiresIn}</strong>
        </Text>
      </Section>

      <Section style={ctaBoxStyles}>
        <Button
          href={resetUrl}
          style={primaryButtonStyles}
        >
          Resetear Contraseña
        </Button>
      </Section>

      <Hr style={hrStyles} />

      <Text style={altInstructionsStyles}>
        O copia este enlace en tu navegador:
      </Text>
      <Text style={linkStyles}>{resetUrl}</Text>

      <Hr style={hrStyles} />

      <Section style={securityInfoStyles}>
        <Heading as="h3" style={subheadingStyles}>Información de Seguridad</Heading>
        {timestamp && (
          <Text style={securityDetailStyles}>
            <strong>Solicitado:</strong> {timestamp}
          </Text>
        )}
        {ipAddress && (
          <Text style={securityDetailStyles}>
            <strong>Desde IP:</strong> {ipAddress}
          </Text>
        )}
        <Text style={securityDetailStyles}>
          Si no solicitaste resetear tu contraseña, ignora este correo y tu contraseña permanecerá sin cambios.
        </Text>
      </Section>

      <Text style={footerMessageStyles}>
        Por seguridad, no compartiremos tu contraseña por correo. Siempre cambia tu contraseña usando links seguros.
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

const subheadingStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  margin: '12px 0 8px 0',
  color: '#333',
};

const textStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '12px 0',
  lineHeight: '1.5',
};

const warningBoxStyles: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  padding: '12px 16px',
  margin: '20px 0',
  borderRadius: '4px',
};

const warningTextStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
  fontWeight: '500',
};

const ctaBoxStyles: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const primaryButtonStyles: React.CSSProperties = {
  backgroundColor: '#dc2626',
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

const securityInfoStyles: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #059669',
  padding: '12px 16px',
  margin: '16px 0',
  borderRadius: '4px',
};

const securityDetailStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: '6px 0',
  lineHeight: '1.4',
};

const footerMessageStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  fontStyle: 'italic',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};
