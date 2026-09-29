import { useState } from 'react'

interface Props {
  onBack: () => void
}

interface Contact {
  id: string
  name: string
  phone: string
  relation: string
  notifyOnTrip: boolean
}

const initContacts: Contact[] = [
  { id: 'ec1', name: 'Meera Sharma', phone: '+91 94567 89012', relation: 'Spouse', notifyOnTrip: true },
  { id: 'ec2', name: 'Ravi Sharma', phone: '+91 98001 23456', relation: 'Brother', notifyOnTrip: false },
]

export default function EmergencyContactsScreen({ onBack }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initContacts)
  const [adding, setAdding] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' })
  const [showPicker, setShowPicker] = useState(false)

  const phoneContacts = [
    { name: 'Ananya Sharma', phone: '+91 98765 43210', relation: 'Sister' },
    { name: 'Rohit Verma', phone: '+91 99887 76655', relation: 'Friend' },
    { name: 'Sunita Rao', phone: '+91 77665 54433', relation: 'Mother' },
    { name: 'Vikram Singh', phone: '+91 88776 65544', relation: 'Colleague' },
  ]

  const addContact = () => {
    if (!newContact.name || !newContact.phone) return
    setContacts((c) => [...c, { ...newContact, id: `ec${Date.now()}`, notifyOnTrip: true }])
    setNewContact({ name: '', phone: '', relation: '' })
    setAdding(false)
  }

  const toggleNotify = (id: string) =>
    setContacts((c) => c.map((x) => x.id === id ? { ...x, notifyOnTrip: !x.notifyOnTrip } : x))

  const remove = (id: string) => setContacts((c) => c.filter((x) => x.id !== id))

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4" style={{ paddingTop: 56, paddingBottom: 14 }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Emergency Contacts
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPicker(true)}
              className="text-xs font-bold text-sr-blue px-3 py-2 rounded-xl border border-sr-blue-soft bg-sr-blue-light"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              From Contacts
            </button>
            <button
              onClick={() => setAdding(true)}
              className="text-xs font-bold text-white px-3 py-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', fontFamily: "'Outfit', sans-serif" }}
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-8 space-y-4">
        {/* Safety info */}
        <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3 border border-red-100">
          <span className="text-xl mt-0.5">🆘</span>
          <div>
            <p className="text-sm font-semibold text-red-700 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Why Emergency Contacts?
            </p>
            <p className="text-xs text-red-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              These contacts can be notified of your live trip location when you press the SOS button or when they request a trip update.
            </p>
          </div>
        </div>

        {/* Contact list */}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                {contact.relation === 'Spouse' ? '💑' : contact.relation === 'Brother' ? '👦' : '👤'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{contact.name}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {contact.relation}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{contact.phone}</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Notify on trips
                    </span>
                    <button
                      onClick={() => toggleNotify(contact.id)}
                      className="w-9 h-5 rounded-full transition-all relative"
                      style={{ background: contact.notifyOnTrip ? '#2563EB' : '#CBD5E1' }}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-all" style={{ left: contact.notifyOnTrip ? '1.1rem' : '0.1rem' }} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-xl bg-sr-blue-light flex items-center justify-center">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 1.5L12.5 4.5M2 10.5L10 2.5C10.8 1.7 12.1 1.7 12.9 2.5C13.7 3.3 13.7 4.6 12.9 5.4L4.5 13.5H2V10.5Z" stroke="#2563EB" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button onClick={() => remove(contact.id)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3L11 11M11 3L3 11" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-sm text-slate-500">No emergency contacts added yet</p>
          </div>
        )}

        {/* Add contact form */}
        {adding && (
          <div className="bg-white rounded-2xl p-4 border-2 border-sr-blue" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
            <h4 className="text-sm font-bold text-slate-900 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>New Emergency Contact</h4>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Meera Sharma', type: 'text' },
                { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel' },
                { key: 'relation', label: 'Relationship', placeholder: 'e.g. Spouse, Parent, Friend', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</label>
                  <input
                    type={type}
                    value={newContact[key as keyof typeof newContact]}
                    onChange={(e) => setNewContact((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sr-blue transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Cancel
                </button>
                <button onClick={addContact} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', fontFamily: "'Outfit', sans-serif" }}>
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-medium active:bg-slate-50 transition-colors"
          >
            + Add Emergency Contact
          </button>
        )}

        {/* Contact picker modal */}
        {showPicker && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowPicker(false)}
          >
            <div
              className="bg-white rounded-t-3xl px-5 py-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
              <h4 className="text-base font-bold text-slate-900 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Pick from Contacts
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto hide-scrollbar">
                {phoneContacts.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setContacts((prev) => [
                        ...prev,
                        { id: `ec${Date.now()}`, ...c, notifyOnTrip: true },
                      ])
                      setShowPicker(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl active:bg-slate-50 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-sr-blue-light flex items-center justify-center font-bold text-sr-blue text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{c.name}</p>
                      <p className="text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>{c.phone} · {c.relation}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4L10 8L6 12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
