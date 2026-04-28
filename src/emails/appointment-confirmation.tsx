/**
 * Email: Confirmación de Cita
 */

import React from 'react';
import {
  Section,
  Row,
  Column,
  Text,
  Button,
  Heading,
} from '@react-email/components';
import { EmailLayout } from './email-layout';

interface AppointmentConfirmationEmailProps {
  customerName: string;
  businessName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  appointmentId: string;
  duration: string;
  price?: number;
  location?: string;
  notes?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
}

export const AppointmentConfirmationEmail: React.FC<AppointmentConfirmationEmailProps> = ({
  customerName,
  businessName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  appointmentId,
  duration,
  price,
  location,
  notes,
  cancelUrl,
  rescheduleUrl,
}) => {
  return (
    <EmailLayout
      title={`Cita Confirmada - ${businessName}`}
      previewText={`Tu cita con ${businessName} está confirmada para ${appointmentDate}`}
    >
      <Heading style={headingStyles}>¡Cita Confirmada!</Heading>

      <Text style={textStyles}>
        Hola {customerName},
      </Text>

      <Text style={textStyles}>
        Tu cita con <strong>{businessName}</strong> ha sido confirmada exitosamente.
      </Text>

      {/* Detalles de la cita */}
      <Section style={detailsBoxStyles}>
        <Row style={rowStyles}>
          <Column style={columnLabelStyles}>
            <Text style={labelStyles}>📅 Fecha</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={valueStyles}>{appointmentDate}</Text>
          </Column>
        </Row>

        <Row style={rowStyles}>
          <Column style={columnLabelStyles}>
            <Text style={labelStyles}>⏰ Hora</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={valueStyles}>{appointmentTime}</Text>
          </Column>
        </Row>

        <Row style={rowStyles}>
          <Column style={columnLabelStyles}>
            <Text style={labelStyles}>🎯 Servicio</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={valueStyles}>{appointmentType}</Text>
          </Column>
        </Row>

        <Row style={rowStyles}>
          <Column style={columnLabelStyles}>
            <Text style={labelStyles}>⏳ Duración</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={valueStyles}>{duration}</Text>
          </Column>
        </Row>

        {location && (
          <Row style={rowStyles}>
            <Column style={columnLabelStyles}>
              <Text style={labelStyles}>📍 Ubicación</Text>
            </Column>
            <Column style={columnValueStyles}>
              <Text style={valueStyles}>{location}</Text>
            </Column>
          </Row>
        )}

        {price && (
          <Row style={rowStyles}>
            <Column style={columnLabelStyles}>
              <Text style={labelStyles}>💰 Precio</Text>
            </Column>
            <Column style={columnValueStyles}>
              <Text style={valueStyles}>${price.toFixed(2)} MXN</Text>
            </Column>
          </Row>
        )}

        <Row style={rowStyles}>
          <Column style={columnLabelStyles}>
            <Text style={labelStyles}>🔔 ID de Cita</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={{ ...valueStyles, fontFamily: 'monospace', fontSize: '12px' }}>
              {appointmentId}
            </Text>
          </Column>
        </Row>
      </Section>

      {notes && (
        <Section style={notesStyles}>
          <Heading as="h3" style={subheadingStyles}>Notas Importantes</Heading>
          <Text style={textStyles}>{notes}</Text>
        </Section>
      )}

      {/* Acciones */}
      <Section style={actionsStyles}>
        <Row>
          {rescheduleUrl && (
            <Column style={buttonColumnStyles}>
              <Button
                href={rescheduleUrl}
                style={{
                  ...buttonStyles,
                  backgroundColor: '#0066cc',
                }}
              >
                Reprogramar Cita
              </Button>
            </Column>
          )}
          {cancelUrl && (
            <Column style={buttonColumnStyles}>
              <Button
                href={cancelUrl}
                style={{
                  ...buttonStyles,
                  backgroundColor: '#d4d4d8',
                  color: '#333',
                }}
              >
                Cancelar Cita
              </Button>
            </Column>
          )}
        </Row>
      </Section>

      <Text style={footerMessageStyles}>
        Si no programaste esta cita, por favor contacta con {businessName} inmediatamente.
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
  fontSize: '18px',
  fontWeight: '600',
  margin: '16px 0 8px 0',
  color: '#333',
};

const textStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '12px 0',
  lineHeight: '1.5',
};

const detailsBoxStyles: React.CSSProperties = {
  backgroundColor: '#f8f8f8',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #e5e5e5',
};

const rowStyles: React.CSSProperties = {
  marginBottom: '12px',
};

const columnLabelStyles: React.CSSProperties = {
  width: '120px',
  paddingRight: '16px',
  verticalAlign: 'top',
};

const columnValueStyles: React.CSSProperties = {
  flex: 1,
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#999',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const valueStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#333',
  margin: '0',
};

const notesStyles: React.CSSProperties = {
  backgroundColor: '#fffbea',
  borderLeft: '4px solid #f59e0b',
  padding: '12px 16px',
  margin: '16px 0',
  borderRadius: '4px',
};

const actionsStyles: React.CSSProperties = {
  margin: '24px 0',
};

const buttonColumnStyles: React.CSSProperties = {
  width: '100%',
  paddingRight: '8px',
};

const buttonStyles: React.CSSProperties = {
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  color: '#ffffff',
  textDecoration: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'center' as const,
};

const footerMessageStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  fontStyle: 'italic',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
};
