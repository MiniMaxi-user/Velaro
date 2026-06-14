import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
} from '@react-pdf/renderer'
import path from 'node:path'
import type { ContractPdfData } from './pdfData'

// ── Contract-PDF in Velaro-huisstijl (STAL-12) ───────────────────────────────
// Eigen set @react-pdf/renderer-componenten (niet de web-UI), maar met dezelfde
// huisstijl: navy/goud, logo public/velaro_logo.png en de fonts Cormorant Garamond
// (koppen) + Inter (body). De inhoud komt uit bouwContractPdfData zodat de labels
// gelijk zijn aan de web-weergave (ContractSamenvatting).

// Huisstijlkleuren — overgenomen uit src/styles/globals.css (@theme).
const COLORS = {
  navy: '#1A2B4A',
  gold: '#D8BD71',
  goldDark: '#BEA256',
  bg: '#F5F3EE',
  surface2: '#EEEAE2',
  muted: '#6B7280',
  border: '#E2DDD2',
  white: '#FFFFFF',
}

// Fonts worden geregistreerd vanaf de Google Fonts-CDN (gstatic) TTF-bestanden;
// react-pdf haalt ze server-side op bij het renderen. Zo matchen we de huisstijl
// zonder fontbinaries in de repo te hoeven opnemen. Idempotent registreren zodat
// herhaalde renders binnen hetzelfde proces niet dubbel registreren.
let fontsRegistered = false
function ensureFonts() {
  if (fontsRegistered) return
  Font.register({
    family: 'Cormorant Garamond',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/cormorantgaramond/v17/co3bmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/cormorantgaramond/v17/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtFvHTPLDA.ttf',
        fontWeight: 600,
      },
    ],
  })
  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v19/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf',
        fontWeight: 600,
      },
    ],
  })
  fontsRegistered = true
}

// Absoluut pad naar het logo in public/. react-pdf leest het bestand server-side.
const LOGO_PATH = path.join(process.cwd(), 'public', 'velaro_logo.png')

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: 'Inter',
    fontSize: 10,
    color: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    marginBottom: 24,
  },
  logo: {
    width: 120,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontWeight: 600,
    fontSize: 24,
    color: COLORS.navy,
  },
  metaLine: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 2,
  },
  partijenBlok: {
    backgroundColor: COLORS.surface2,
    borderRadius: 6,
    padding: 14,
    marginBottom: 24,
  },
  partijenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  partijItem: {
    width: '50%',
    marginBottom: 8,
  },
  veldLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  veldWaarde: {
    fontSize: 11,
    color: COLORS.navy,
    fontWeight: 500,
  },
  sectie: {
    marginBottom: 16,
  },
  sectieTitel: {
    fontFamily: 'Cormorant Garamond',
    fontWeight: 600,
    fontSize: 15,
    color: COLORS.navy,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 8,
  },
  regel: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  regelLabel: {
    width: '45%',
    color: COLORS.muted,
    fontSize: 10,
  },
  regelWaarde: {
    width: '55%',
    color: COLORS.navy,
    fontSize: 10,
  },
  handtekeningSectie: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 20,
  },
  handtekeningTitel: {
    fontFamily: 'Cormorant Garamond',
    fontWeight: 600,
    fontSize: 14,
    color: COLORS.navy,
    marginBottom: 16,
  },
  handtekeningRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  handtekeningVak: {
    width: '45%',
  },
  handtekeningLijn: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navy,
    height: 48,
    marginBottom: 6,
  },
  handtekeningLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
})

function Veld({ label, waarde }: { label: string; waarde: string }) {
  return (
    <View style={styles.partijItem}>
      <Text style={styles.veldLabel}>{label}</Text>
      <Text style={styles.veldWaarde}>{waarde}</Text>
    </View>
  )
}

export function ContractPdfDocument({ data }: { data: ContractPdfData }) {
  ensureFonts()

  return (
    <Document
      title={`${data.titel} — versie ${data.versie}`}
      author="Velaro"
    >
      <Page size="A4" style={styles.page}>
        {/* Kop met logo, titel, versie en generatiedatum */}
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_PATH} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.title}>{data.titel}</Text>
            <Text style={styles.metaLine}>Versie {data.versie}</Text>
            <Text style={styles.metaLine}>Opgesteld op {data.generatieDatum}</Text>
          </View>
        </View>

        {/* Partijenblok: stal, eigenaar en paard */}
        <View style={styles.partijenBlok}>
          <View style={styles.partijenGrid}>
            <Veld label="Pensionstal" waarde={data.partijen.stalNaam} />
            <Veld label="Paardeigenaar" waarde={data.partijen.eigenaarNaam} />
            {data.partijen.stalAdres && (
              <Veld label="Adres stal" waarde={data.partijen.stalAdres} />
            )}
            <Veld label="Paard" waarde={data.partijen.paardNaam} />
            {data.partijen.ingangsdatum && (
              <Veld label="Ingangsdatum" waarde={data.partijen.ingangsdatum} />
            )}
          </View>
        </View>

        {/* Artikelen/secties — uitsluitend voor aangezette/ingevulde optieblokken */}
        {data.secties.map((sectie) => (
          <View key={sectie.titel} style={styles.sectie} wrap={false}>
            <Text style={styles.sectieTitel}>{sectie.titel}</Text>
            {sectie.regels.map((regel, i) => (
              <View key={i} style={styles.regel}>
                <Text style={styles.regelLabel}>{regel.label}</Text>
                <Text style={styles.regelWaarde}>{regel.waarde}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Gereserveerde handtekeningruimte — geen ondertekeningsfunctionaliteit */}
        <View style={styles.handtekeningSectie} wrap={false}>
          <Text style={styles.handtekeningTitel}>Ondertekening</Text>
          <View style={styles.handtekeningRij}>
            <View style={styles.handtekeningVak}>
              <View style={styles.handtekeningLijn} />
              <Text style={styles.handtekeningLabel}>
                Pensionstal — {data.partijen.stalNaam}
              </Text>
              <Text style={styles.handtekeningLabel}>Naam, datum en handtekening</Text>
            </View>
            <View style={styles.handtekeningVak}>
              <View style={styles.handtekeningLijn} />
              <Text style={styles.handtekeningLabel}>
                Paardeigenaar — {data.partijen.eigenaarNaam}
              </Text>
              <Text style={styles.handtekeningLabel}>Naam, datum en handtekening</Text>
            </View>
          </View>
        </View>

        {/* Voettekst */}
        <View style={styles.footer} fixed>
          <Text>
            {data.titel} — {data.partijen.paardNaam} (versie {data.versie})
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
