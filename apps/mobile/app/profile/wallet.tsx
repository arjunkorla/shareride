import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../lib/theme'
import { ChevronLeftIcon } from '../../components/icons'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  desc: string
  amount: number
  dateLabel: string
  icon: string
}

// Ported from src/screens/profile/WalletScreen.tsx. Transaction descriptions
// use request/match language, not "booking" — no seat-priced line items.
const TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'credit', desc: 'Ride earnings: Madhapur -> Gachibowli', amount: 1350, dateLabel: '8 Aug 2026', icon: '🚗' },
  { id: 't2', type: 'debit', desc: 'Matched ride: Madhapur -> Gachibowli', amount: 450, dateLabel: '7 Aug 2026', icon: '🤝' },
  { id: 't3', type: 'credit', desc: 'Ride earnings: Kondapur -> HITEC City', amount: 900, dateLabel: '2 Aug 2026', icon: '🚗' },
  { id: 't4', type: 'debit', desc: 'Matched ride: Secunderabad -> HITEC City', amount: 320, dateLabel: '28 Jul 2026', icon: '🤝' },
  { id: 't5', type: 'credit', desc: 'Refund: Cancelled ride', amount: 450, dateLabel: '25 Jul 2026', icon: '↩️' },
  { id: 't6', type: 'debit', desc: 'Platform fee (2%)', amount: 27, dateLabel: '25 Jul 2026', icon: '🏷️' },
]

export default function WalletScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<'all' | 'earnings' | 'expenses'>('all')

  const balance = 3240
  const earnings = TRANSACTIONS.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const expenses = TRANSACTIONS.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const displayed = tab === 'all' ? TRANSACTIONS : TRANSACTIONS.filter((t) => (tab === 'earnings' ? t.type === 'credit' : t.type === 'debit'))

  return (
    <View style={styles.screen}>
      <View style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeftIcon color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Pressable style={styles.addMoneyButton}>
            <Text style={styles.addMoneyText}>+ Add Money</Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceValue}>₹{balance.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[styles.statLabel, { color: colors.green }]}>Total Earned</Text>
            <Text style={[styles.statValue, { color: colors.greenDark }]}>₹{earnings.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.redSoft }]}>
            <Text style={[styles.statLabel, { color: colors.red }]}>Total Spent</Text>
            <Text style={[styles.statValue, { color: '#B91C1C' }]}>₹{expenses.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          {[{ icon: '⬆️', label: 'Withdraw' }, { icon: '💳', label: 'Pay Methods' }, { icon: '📄', label: 'Statement' }].map((a) => (
            <Pressable key={a.label} style={styles.actionButton}>
              <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <View style={styles.tabRow}>
            {(['all', 'earnings', 'expenses'] as const).map((t) => (
              <Pressable key={t} style={[styles.tabPill, tab === t && styles.tabPillActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>{t[0].toUpperCase() + t.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.txList}>
          {displayed.map((tx, i) => (
            <View key={tx.id} style={[styles.txRow, i < displayed.length - 1 && styles.txRowBorder]}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#D1FAE5' : colors.redSoft }]}>
                <Text style={{ fontSize: 16 }}>{tx.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.desc}</Text>
                <Text style={styles.txDate}>{tx.dateLabel}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? colors.green : colors.red }]}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerGradient: { backgroundColor: colors.slate900, paddingHorizontal: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: 'white' },
  addMoneyButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  addMoneyText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
  balanceValue: { fontSize: 40, fontWeight: '800', color: 'white' },
  statsCard: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, marginHorizontal: 16, marginTop: -28, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBox: { flex: 1, borderRadius: radii.md, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, backgroundColor: colors.slate50, borderRadius: radii.md },
  actionLabel: { fontSize: 10, fontWeight: '700', color: colors.slate600 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.slate900 },
  tabRow: { flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: radii.md, padding: 2 },
  tabPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.sm },
  tabPillActive: { backgroundColor: 'white' },
  tabPillText: { fontSize: 10, fontWeight: '700', color: colors.slate400 },
  tabPillTextActive: { color: colors.blue },
  txList: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  txIcon: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 13, fontWeight: '500', color: colors.slate700 },
  txDate: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: '700' },
})
