import path from 'node:path'
import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

/**
 * Užsakymo tiekėjui PDF šablonas (@react-pdf/renderer). Anglų kalba — tiekėjas
 * užsienietis. Rodomi tik užsakomi kiekiai, BE mūsų sandėlio likučių.
 *
 * Inter šriftas su lietuviškais diakritikais (sandėlio prekės pavadinimai gali
 * būti LT, jei nėra EN vertimo).
 */

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

export type SupplierOrderPdfItem = {
  colorNumber: string | null
  name: string
  nameEn: string | null
  sku: string | null
  ean: string | null
  qty: number
}

export type SupplierOrderPdfData = {
  date: string
  items: SupplierOrderPdfItem[]
  note: string | null
}

const styles = StyleSheet.create({
  page: {
    paddingVertical: 32,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Inter',
    color: '#1A1A1A',
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1A1A',
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 700 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    fontSize: 10,
  },
  bold: { fontWeight: 700 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1A1A',
    paddingBottom: 4,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 4,
  },
  cNum: { width: 22 },
  cProduct: { flex: 1, paddingRight: 6 },
  cSku: { width: 120, fontSize: 8, color: '#6B6B6B' },
  cQty: { width: 60, textAlign: 'right', fontWeight: 700 },
  note: {
    marginTop: 18,
    fontSize: 10,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#999999',
    paddingTop: 6,
    fontSize: 8,
    color: '#6B6B6B',
  },
})

export function SupplierOrderPdfDocument({ data }: { data: SupplierOrderPdfData }) {
  const totalQty = data.items.reduce((s, i) => s + i.qty, 0)
  return (
    <Document title="Purchase order">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Purchase order</Text>
          <View style={styles.metaRow}>
            <Text>
              Items: <Text style={styles.bold}>{data.items.length}</Text> ·
              Total: <Text style={styles.bold}>{totalQty} pcs</Text>
            </Text>
            <Text>Date: {data.date}</Text>
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={styles.cNum}>#</Text>
          <Text style={styles.cProduct}>Product</Text>
          <Text style={styles.cSku}>SKU / EAN</Text>
          <Text style={styles.cQty}>Ordered</Text>
        </View>

        {data.items.map((it, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={styles.cNum}>{i + 1}</Text>
            <Text style={styles.cProduct}>
              {it.colorNumber ? `${it.colorNumber} · ` : ''}
              {it.nameEn || it.name}
            </Text>
            <Text style={styles.cSku}>{it.sku ?? it.ean ?? '—'}</Text>
            <Text style={styles.cQty}>{it.qty}</Text>
          </View>
        ))}

        {data.note ? (
          <Text style={styles.note}>
            <Text style={styles.bold}>Note: </Text>
            {data.note}
          </Text>
        ) : null}

        <Text style={styles.footer} fixed>
          Dažai Kirpėjams · Purchase order
        </Text>
      </Page>
    </Document>
  )
}
