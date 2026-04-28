/**
 * Email: Cancelación de Cita
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

export interface CancellationNoticeEmailProps {
  customerName: string;
  businessName: string;
  appointmentType: string;
  originalDate: string;
  originalTime: string;
  cancelledDate: string;
  cancellationReason?: string;
  refundAmount?: number;
  currency?: string;
  refundStatus?: string;
  rebookingUrl?: string;
  contactEmail?: string;
}

export const CancellationNoticeEmail: React.FC<CancellationNoticeEmailProps> = ({
  customerName,
  businessName,
  appointmentType,
  originalDate,
  originalTime,
  cancelledDate,
  cancellationReason,
  refundAmount,
  currency = 'MXN',
  refundStatus = 'En proceso',
  rebookingUrl,
  contactEmail,
}) => {
  return (
    <EmailLayout
      title={`Cita Cancelada - ${businessName}`}
      previewText="Tu cita ha sido cancelada"
    >
      <Heading style={headingStyles}>Cita Cancelada</Heading>

      <Text style={textStyles}>
        Hola {customerName},
      </Text>

      <Text style={textStyles}>
        Tu cita con <strong>{businessName}</strong> ha sido cancelada.
      </Text>

      {/* Detalles de la cita cancelada */}
      <Section style={cancelledBoxStyles}>
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
            <Text style={labelStyles}>📅 Fecha Original</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={valueStyles}>{originalDate} a las {originalTime}</Text>
          </Column>
        </Row>

        <Row style={rowStyles}>
          <Column style={columnLabelStyles}>
            <Text style={labelStyles}>❌ Cancelada</Text>
          </Column>
          <Column style={columnValueStyles}>
            <Text style={valueStyles}>{cancelledDate}</Text>
          </Column>
        </Row>

        {cancellationReason && (
          <Row style={rowStyles}>
            <Column style={columnLabelStyles}>
              <Text style={labelStyles}>💬 Razón</Text>
            </Column>
            <Column style={columnValueStyles}>
              <Text style={valueStyles}>{cancellationReason}</Text>
            </Column>
          </Row>
        )}
      </Section>

      {/* Información de reembolso */}
      {refundAmount && (
        <Section style={refundBoxStyles}>
          <Heading as="h3" style={subheadingStyles}>Información de Reembolso</Heading>
          <Row>
            <Column style={refundLabelStyles}>
              <Text style={refundAmountLabelStyles}>Monto a Reembolsar</Text>
            </Column>
            <Column style={refundValueStyles} align="right">
              <Text style={refundAmountStyles}>
                ${refundAmount.toFixed(2)} {currency}
              </Text>
            </Column>
          </Row>
          <Row>
            <Column style={refundLabelStyles}>
              <Text style={refundStatusLabelStyles}>Estado</Text>
            </Column>
            <Column style={refundValueStyles} align="right">
              <Text style={refundStatusStyles}>{refundStatus}</Text>
            </Column>
          </Row>
          <Text style={refundNoteStyles}>
            El reembolso será procesado a tu método de pago original en 3-5 días hábiles.
          </Text>
        </Section>
      )}

      {/* Acciones */}
      <Section style={actionsStyles}>
        {rebookingUrl && (
          <Button
            href={rebookingUrl}
            style={primaryButtonStyles}
          >
            Agendar Nueva Cita
          </Button>
        )}
      </Section>

      <Hr style={hrStyles} />

      {contactEmail && (
        <Text style={supportTextStyles}>
          Si tienes preguntas, contacta a {businessName} en {contactEmail}
        </Text>
      )}

      <Text style={footerMessageStyles}>
        Esperamos volver a verte pronto.
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
  margin: '0 0 12px 0',
  color: '#333',
};

const textStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  margin: '12px 0',
  lineHeight: '1.5',
};

const cancelledBoxStyles: React.CSSProperties = {
  backgroundColor: '#fee2e2',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #fecaca',
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
  color: '#991b1b',
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

const refundBoxStyles: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #bbf7d0',
};

const refundLabelStyles: React.CSSProperties = {
  width: '50%',
  paddingRight: '12px',
};

const refundValueStyles: React.CSSProperties = {
  width: '50%',
};

const refundAmountLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#166534',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const refundAmountStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0',
};

const refundStatusLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#166534',
  margin: '8px 0 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const refundStatusStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#059669',
  margin: '8px 0 0 0',
};

const refundNoteStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  margin: '12px 0 0 0',
  fontStyle: 'italic',
};

const actionsStyles: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0',
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

const supportTextStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: '12px 0 0 0',
  textAlign: 'center' as const,
};

const footerMessageStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  fontStyle: 'italic',
  margin: '12px 0 0 0',
  textAlign: 'center' as const,
};
