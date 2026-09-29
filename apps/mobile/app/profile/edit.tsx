import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { drivers } from '../../lib/fixtures'
import { colors, radii } from '../../lib/theme'
import { ChevronLeftIcon } from '../../components/icons'

const me = drivers[0]
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const

// Ported from src/screens/profile/EditProfileScreen.tsx. Local-state only
// (no backend) per Phase 3 scope — real profile updates land in a later
// phase per docs/migration-plan.md.
export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [fullName, setFullName] = useState(me.name)
  const [mobile, setMobile] = useState('98765 43210')
  const [email, setEmail] = useState('arjun.sharma@email.com')
  const [languages, setLanguages] = useState(me.languages.join(', '))
  const [gender, setGender] = useState<(typeof GENDERS)[number]>('Male')
  const [dob, setDob] = useState('1992-03-15')
  const [bio, setBio] = useState(me.bio)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable style={[styles.saveButton, saved && styles.saveButtonSaved]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{saved ? '✓ Saved' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: me.avatarUrl }} style={styles.avatar} />
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditGlyph}>✎</Text>
            </View>
          </View>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
        <Field label="Mobile Number" value={mobile} onChangeText={setMobile} placeholder="+91 98765 43210" keyboardType="phone-pad" />
        <Field label="Email Address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Languages" value={languages} onChangeText={setLanguages} placeholder="e.g. Hindi, English" />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => (
              <Pressable
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Field label="Date of Birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.textarea}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 200))}
            placeholder="Tell other riders about yourself..."
            multiline
            numberOfLines={3}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        <Pressable style={[styles.saveButtonLarge, saved && styles.saveButtonLargeSaved]} onPress={handleSave}>
          <Text style={styles.saveButtonLargeText}>{saved ? '✓ Changes Saved' : 'Save Changes'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

interface FieldProps extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize'> {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    backgroundColor: colors.white,
  },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  saveButton: { backgroundColor: colors.blue, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 8 },
  saveButtonSaved: { backgroundColor: colors.green },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 13 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: radii.xl, backgroundColor: colors.slate100, borderWidth: 2, borderColor: 'white' },
  avatarEditBadge: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.blue, borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
  avatarEditGlyph: { color: 'white', fontSize: 13 },
  changePhotoText: { marginTop: 12, fontSize: 12, color: colors.blue, fontWeight: '600' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.slate900 },
  textarea: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.slate900, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: colors.slate400, textAlign: 'right', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50 },
  genderChipActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  genderChipText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  genderChipTextActive: { color: colors.blue },
  saveButtonLarge: { marginTop: 8, paddingVertical: 14, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center' },
  saveButtonLargeSaved: { backgroundColor: colors.green },
  saveButtonLargeText: { color: 'white', fontWeight: '700', fontSize: 14 },
})
