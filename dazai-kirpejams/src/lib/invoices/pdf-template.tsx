import path from 'node:path'
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { InvoiceData } from './types'
import { INVOICE_BRAND_DEFAULTS } from './types'

/**
 * PVM sąskaitos faktūros PDF šablonas. Naudoja @react-pdf/renderer —
 * JSX kompiliuojamas į PDF serveryje.
 *
 * Šriftas: Inter (Latin + Latin-Ext subset'ai). Default Helvetica NEPALAIKO
 * lietuviškų diakritikų (ą, ę, į, ų, ė, č, š, ž, ū), todėl registruojam
 * Inter TTF failus iš `public/fonts/`. Failai įtraukiami į Vercel deploy'ą
 * kaip dalis `public/` direktorijos.
 *
 * Dizainas — švarus, profesionalus A4 formatas, atitinka LR PVM sąskaitos
 * faktūros reikalavimus (seller+buyer rekvizitai, prekių lentelė, sumos,
 * PVM, mokėjimo detalės).
 */

// Šriftų registracija turi įvykti PRIEŠ pirmą render'ą. Module-level'yje
// užtikrina, kad tai atsitinka vieną kartą per Node procesą (dev reload'ai
// apeina module cache — @react-pdf/renderer Font.register'is idempotentiškas).
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'),
      fontWeight: 700,
    },
  ],
})

const PALETTE = {
  text: '#1A1A1A',
  muted: '#6B6B6B',
  border: '#E0E0E0',
  lightBg: '#F5F5F7',
}

/**
 * Stilių fabrikas. Akcentinė spalva priklauso nuo brand'o nustatymų,
 * todėl stilius kuriame per render'ą. Kiti PALETTE laukai statiški.
 */
function createStyles(accent: string) {
  return StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Inter',
    color: PALETTE.text,
    lineHeight: 1.4,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: `2pt solid ${accent}`,
  },
  logoSection: {
    flexDirection: 'column',
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PALETTE.text,
  },
  brandTagline: {
    fontSize: 8,
    color: PALETTE.muted,
    marginTop: 2,
  },
  invoiceMeta: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: PALETTE.muted,
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
    color: PALETTE.text,
  },
  invoiceDate: {
    fontSize: 9,
    color: PALETTE.muted,
    marginTop: 4,
  },

  // Parties
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  party: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: PALETTE.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 9,
    color: PALETTE.text,
    marginBottom: 2,
  },
  partyMuted: {
    fontSize: 8,
    color: PALETTE.muted,
    marginBottom: 2,
  },

  // Items table
  tableWrap: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PALETTE.lightBg,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottom: `1pt solid ${PALETTE.border}`,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: PALETTE.muted,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottom: `0.5pt solid ${PALETTE.border}`,
  },
  tableCell: {
    fontSize: 9,
    color: PALETTE.text,
  },
  colName: { flex: 3 },
  colSku: { flex: 1 },
  colUnit: { width: 36, textAlign: 'center' },
  colQty: { width: 36, textAlign: 'right' },
  colPrice: { width: 70, textAlign: 'right' },
  colTotal: { width: 70, textAlign: 'right' },

  // Totals block
  totalsWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  totalsBox: {
    width: 240,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 9,
    color: PALETTE.muted,
  },
  totalsValue: {
    fontSize: 9,
    color: PALETTE.text,
    fontWeight: 'bold',
  },
  totalsDivider: {
    borderTop: `1pt solid ${PALETTE.border}`,
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: PALETTE.lightBg,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: PALETTE.text,
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: accent,
  },

  // Payment + notes
  paymentBox: {
    backgroundColor: PALETTE.lightBg,
    padding: 12,
    marginBottom: 12,
    borderLeft: `3pt solid ${accent}`,
  },
  paymentTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: PALETTE.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  paymentLine: {
    fontSize: 9,
    marginBottom: 3,
  },
  paymentLabel: {
    fontSize: 8,
    color: PALETTE.muted,
  },
  notesBox: {
    padding: 12,
    marginBottom: 20,
    border: `0.5pt solid ${PALETTE.border}`,
    borderRadius: 2,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: PALETTE.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: PALETTE.text,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: PALETTE.muted,
    borderTop: `0.5pt solid ${PALETTE.border}`,
    paddingTop: 8,
  },
  })
}

function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Banko pavedimas',
  paysera: 'Paysera',
  stripe: 'Mokėjimo kortelė',
}

export function InvoicePdfDocument({ data }: { data: InvoiceData }) {
  const {
    invoiceNumber,
    issuedAt,
    orderNumber,
    seller,
    buyer,
    items,
    subtotalCents,
    discountCents,
    deliveryCostCents,
    vatCents,
    vatRate,
    totalCents,
    paymentMethod,
    notes,
    paymentDueDate,
  } = data

  // Legacy sąskaitos (iki 015 migracijos) neturi brand_snapshot — naudojam
  // default'us, kad esami PDF'ai regeneruotųsi vienodai.
  const brand = data.brand ?? INVOICE_BRAND_DEFAULTS
  const styles = createStyles(brand.accentColor || INVOICE_BRAND_DEFAULTS.accentColor)

  const buyerIsCompany = Boolean(buyer.companyName)
  const buyerAddressLine = [buyer.postalCode, buyer.city]
    .filter(Boolean)
    .join(' ')

  return (
    <Document
      title={`Sąskaita faktūra ${invoiceNumber}`}
      author={seller.legalName || brand.brandName}
      subject={`PVM sąskaita faktūra užsakymui ${orderNumber}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.brandName}>{brand.brandName}</Text>
            {brand.tagline && (
              <Text style={styles.brandTagline}>{brand.tagline}</Text>
            )}
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>
              {vatCents > 0 ? 'PVM sąskaita faktūra' : 'Sąskaita faktūra'}
            </Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Išrašyta: {formatDate(issuedAt)}
            </Text>
            {paymentDueDate && (
              <Text style={styles.invoiceDate}>
                Apmokėti iki: {formatDate(paymentDueDate)}
              </Text>
            )}
            <Text style={styles.invoiceDate}>Užsakymas: {orderNumber}</Text>
          </View>
        </View>

        {/* Parties: Seller + Buyer */}
        <View style={styles.parties}>
          {/* Seller */}
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Pardavėjas</Text>
            <Text style={styles.partyName}>
              {seller.legalName || '—'}
            </Text>
            {seller.regCode && (
              <Text style={styles.partyMuted}>Įm. k.: {seller.regCode}</Text>
            )}
            {seller.vatCode && (
              <Text style={styles.partyMuted}>
                PVM mok. k.: {seller.vatCode}
              </Text>
            )}
            {seller.address && (
              <Text style={styles.partyLine}>{seller.address}</Text>
            )}
            {seller.email && (
              <Text style={styles.partyLine}>{seller.email}</Text>
            )}
            {seller.phone && (
              <Text style={styles.partyLine}>{seller.phone}</Text>
            )}
          </View>

          {/* Buyer */}
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Pirkėjas</Text>
            {buyerIsCompany ? (
              <>
                <Text style={styles.partyName}>{buyer.companyName}</Text>
                {buyer.companyCode && (
                  <Text style={styles.partyMuted}>
                    Įm. k.: {buyer.companyCode}
                  </Text>
                )}
                {buyer.vatCode && (
                  <Text style={styles.partyMuted}>
                    PVM mok. k.: {buyer.vatCode}
                  </Text>
                )}
                <Text style={styles.partyLine}>
                  Kontaktinis asmuo: {buyer.firstName} {buyer.lastName}
                </Text>
              </>
            ) : (
              <Text style={styles.partyName}>
                {buyer.firstName} {buyer.lastName}
              </Text>
            )}
            {buyer.address && (
              <Text style={styles.partyLine}>{buyer.address}</Text>
            )}
            {buyerAddressLine && (
              <Text style={styles.partyLine}>{buyerAddressLine}</Text>
            )}
            <Text style={styles.partyLine}>{buyer.email}</Text>
            {buyer.phone && (
              <Text style={styles.partyLine}>{buyer.phone}</Text>
            )}
          </View>
        </View>

        {/* Items table — kainos rodomos SU PVM (sutampa su tuo, ką klientas
            matė krepšelyje). PVM išskaidymas — žemiau totals bloke. */}
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colName]}>
              Prekė / paslauga
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Mat. vnt.</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Kiekis</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              {vatCents > 0 ? 'Kaina su PVM' : 'Vnt. kaina'}
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>
              Suma
            </Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colName]}>
                {item.name}
              </Text>
              <Text
                style={[styles.tableCell, styles.colSku, { color: PALETTE.muted }]}
              >
                {item.sku || '—'}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit, { color: PALETTE.muted }]}>
                vnt.
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatCents(item.unitPriceCents)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colTotal,
                  { fontWeight: 'bold' },
                ]}
              >
                {formatCents(item.totalCents)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals — visos sumos (subtotal/delivery/total) yra SU PVM.
            Apmokestinamoji vertė ir PVM išskaičiuojami iš bendros sumos
            pagal LR PVM įstatymo reikalavimus: iš viso su PVM + iš jos PVM
            + apmokestinamoji vertė. */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Prekių suma{vatCents > 0 ? ' (su PVM)' : ''}
              </Text>
              <Text style={styles.totalsValue}>
                {formatCents(subtotalCents)}
              </Text>
            </View>
            {discountCents > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Nuolaida</Text>
                <Text style={[styles.totalsValue, { color: brand.accentColor }]}>
                  −{formatCents(discountCents)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Pristatymas</Text>
              <Text style={styles.totalsValue}>
                {deliveryCostCents === 0
                  ? 'Nemokamas'
                  : formatCents(deliveryCostCents)}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Iš viso mokėti</Text>
              <Text style={styles.grandTotalValue}>
                {formatCents(totalCents)}
              </Text>
            </View>
            {vatCents > 0 && (
              <>
                <View style={[styles.totalsDivider, { marginTop: 10 }]} />
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    Apmokestinamoji vertė
                  </Text>
                  <Text style={styles.totalsValue}>
                    {formatCents(totalCents - vatCents)}
                  </Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    Iš jos PVM ({vatRate.toFixed(0)}%)
                  </Text>
                  <Text style={styles.totalsValue}>
                    {formatCents(vatCents)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment details */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Mokėjimo informacija</Text>
          <Text style={styles.paymentLine}>
            <Text style={styles.paymentLabel}>Būdas: </Text>
            {PAYMENT_LABELS[paymentMethod] ?? paymentMethod}
          </Text>
          {paymentMethod === 'bank_transfer' && seller.bankIban && (
            <>
              <Text style={styles.paymentLine}>
                <Text style={styles.paymentLabel}>Gavėjas: </Text>
                {seller.bankRecipient || seller.legalName}
              </Text>
              <Text style={styles.paymentLine}>
                <Text style={styles.paymentLabel}>Sąskaita: </Text>
                {seller.bankIban}
              </Text>
              {seller.bankName && (
                <Text style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Bankas: </Text>
                  {seller.bankName}
                </Text>
              )}
              <Text style={styles.paymentLine}>
                <Text style={styles.paymentLabel}>Mokėjimo paskirtis: </Text>
                Užsakymas {orderNumber}
              </Text>
            </>
          )}
        </View>

        {notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Pastabos</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer — brand.footerText (laisva eilutė) arba auto iš seller */}
        <Text style={styles.footer}>
          {brand.footerText
            ? brand.footerText
            : [
                seller.legalName || brand.brandName,
                seller.regCode && `Įm. k. ${seller.regCode}`,
                seller.email,
                seller.phone,
              ]
                .filter(Boolean)
                .join(' · ')}
        </Text>
      </Page>
    </Document>
  )
}
