/**
 * Email: Recibo de Pago
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

export interface PaymentReceiptEmailProps {
  customerName: string;
  customerEmail: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  transactionId: string;
  businessName: string;
  description: string;
  invoiceUrl?: string;
  downloadUrl?: string;
}

export const PaymentReceiptEmail: React.FC<PaymentReceiptEmailProps> = ({
  customerName,
  customerEmail,
  invoiceNumber,
  date,
  amount,
  currency = 'MXN',
  paymentMethod,
  transactionId,
  businessName,
  description,
  invoiceUrl,
  downloadUrl,
}) => {
  return (
    <EmailLayout
      title={`Recibo de Pago #${invoiceNumber}`}
      previewText={`Tu recibo de pago de ${amount} ${currency} ha sido procesado`}
    >
      <Heading style={headingStyles}>¡Pago Recibido!</Heading>

      <Text style={textStyles}>
        Hola {customerName},
      </Text>

      <Text style={textStyles}>
        Tu pago ha sido procesado exitosamente. Aquí está tu recibo.
      </Text>

      {/* Recibo */}
      <Section style={receiptBoxStyles}>
        <Row style={receiptHeaderRowStyles}>
          <Column style={receiptHeaderColStyles}>
            <Text style={receiptLabelStyles}>Recibo #</Text>
            <Text style={receiptValueStyles}>{invoiceNumber}</Text>
          </Column>
          <Column style={receiptHeaderColStyles}>
            <Text style={receiptLabelStyles}>Fecha</Text>
            <Text style={receiptValueStyles}>{date}</Text>
          </Column>
        </Row>

        <Hr style={internalHrStyles} />

        <Row>
          <Column style={fullWidthColStyles}>
            <Text style={receiptLabelStyles}>De</Text>
            <Text style={receiptNameStyles}>{businessName}</Text>
            <Text style={receiptDetailStyles}>{customerEmail}</Text>
          </Column>
        </Row>

        <Row style={rowSpacerStyles}>
          <Column style={fullWidthColStyles}>
            <Text style={receiptLabelStyles}>Descripción</Text>
            <Text style={receiptDetailStyles}>{description}</Text>
          </Column>
        </Row>

        <Hr style={internalHrStyles} />

        <Row style={amountRowStyles}>
          <Column style={amountLabelColStyles}>
            <Text style={receiptLabelStyles}>Total</Text>
          </Column>
          <Column style={amountValueColStyles} align="right">
            <Text style={totalAmountStyles}>
              ${amount.toFixed(2)} {currency}
            </Text>
          </Column>
        </Row>

        <Row style={rowSpacerStyles}>
          <Column style={fullWidthColStyles}>
            <Text style={receiptLabelStyles}>Método de Pago</Text>
            <Text style={receiptDetailStyles}>{paymentMethod}</Text>
          </Column>
        </Row>

        <Row>
          <Column style={fullWidthColStyles}>
            <Text style={receiptLabelStyles}>ID de Transacción</Text>
            <Text style={transactionIdStyles}>{transactionId}</Text>
          </Column>
        </Row>
      </Section>

      {/* Acciones */}
      <Section style={actionsStyles}>
        <Row>
          {invoiceUrl && (
            <Column style={buttonColStyles}>
              <Button
                href={invoiceUrl}
                style={{
                  ...buttonStyles,
                  backgroundColor: '#0066cc',
                }}
              >
                Ver Factura
              </Button>
            </Column>
          )}
          {downloadUrl && (
            <Column style={buttonColStyles}>
              <Button
                href={downloadUrl}
                style={{
                  ...buttonStyles,
                  backgroundColor: '#059669',
                }}
              >
                Descargar PDF
              </Button>
            </Column>
          )}
        </Row>
      </Section>

      <Hr style={hrStyles} />

      <Text style={footerMessageStyles}>
        Si tienes preguntas sobre este pago, contacta a {businessName}.
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

const receiptBoxStyles: React.CSSProperties = {
  backgroundColor: '#fafafa',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #e5e5e5',
  fontFamily: 'monospace',
  fontSize: '13px',
};

const receiptHeaderRowStyles: React.CSSProperties = {
  marginBottom: '12px',
};

const receiptHeaderColStyles: React.CSSProperties = {
  width: '50%',
  paddingRight: '12px',
};

const receiptLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#999',
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  fontFamily: 'sans-serif',
};

const receiptValueStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#333',
  margin: '0',
};

const receiptNameStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#000',
  margin: '0',
};

const receiptDetailStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#666',
  margin: '2px 0 0 0',
};

const internalHrStyles: React.CSSProperties = {
  borderColor: '#d4d4d8',
  margin: '12px 0',
  borderWidth: '1px',
  borderStyle: 'dashed',
};

const hrStyles: React.CSSProperties = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
};

const fullWidthColStyles: React.CSSProperties = {
  width: '100%',
};

const rowSpacerStyles: React.CSSProperties = {
  marginTop: '12px',
};

const amountRowStyles: React.CSSProperties = {
  marginBottom: '12px',
  paddingTop: '8px',
  borderTop: '2px solid #d4d4d8',
};

const amountLabelColStyles: React.CSSProperties = {
  width: '50%',
};

const amountValueColStyles: React.CSSProperties = {
  width: '50%',
};

const totalAmountStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#000',
  margin: '0',
  fontFamily: 'sans-serif',
};

const transactionIdStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#666',
  margin: '0',
  wordBreak: 'break-all' as const,
};

const actionsStyles: React.CSSProperties = {
  margin: '24px 0',
};

const buttonColStyles: React.CSSProperties = {
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
