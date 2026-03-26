import { useState, useEffect, useCallback, useRef } from 'react'
import Card from './components/Card'
import SubSection from './components/SubSection'
import InputRow from './components/InputRow'
import { getTrosak, saveTrosak } from './api'

const STORAGE_KEY = 'budget_all'

const MONTHS_HR = [
  'Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj',
  'Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac',
]

function todayPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function prevPeriod(p) {
  const [y, m] = p.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function nextPeriod(p) {
  const [y, m] = p.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

function periodLabel(p) {
  const [y, m] = p.split('-').map(Number)
  return `${MONTHS_HR[m - 1]} ${y}`
}

const INIT = {
  dom_najam: '',
  dom_struja: '', dom_voda: '', dom_plin: '', dom_rezije: '',
  dom_tv: '', dom_net: '', dom_tel: '', dom_bon: '',
  popravci: '', hrana: '', djeca: '',
  prij_auto: '', prij_motor: '', prij_bicikl: '', prij_brod: '', prij_drugo: '',
  os_odjeca: '', os_kozmetika: '',
  zab_kave: '', zab_ruckovi: '', zab_izleti: '', zab_ostalo: '',
  obrazovanje: '', sport_zdravlje: '', ostalo: '',
  pr_auto: '', pr_gorivo: '', pr_karta: '', pr_taxi: '', pr_drugo: '',
  kr_kredit: '', kr_leasing: '', kr_kartice: '', kr_rate: '', kr_zajmovi: '',
  pi_placa: '', pi_zarada: '', pi_pasivni: '', pi_stipendija: '', pi_ostalo: '',
  st_za: '', st_iznos: '', st_do: '',
}

function n(val) {
  const x = parseFloat(val)
  return isNaN(x) ? 0 : x
}

function fmt(val) {
  return val.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function App() {
  const [period, setPeriod] = useState(todayPeriod)
  const [allData, setAllData] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      return s ? JSON.parse(s) : {}
    } catch { return {} }
  })
  const [syncing, setSyncing] = useState(false)
  const saveTimer = useRef(null)

  // Učitaj podatke iz Strapi kad se promijeni period
  useEffect(() => {
    getTrosak(period).then(data => {
      if (data) {
        setAllData(prev => ({ ...prev, [period]: data }))
      }
    }).catch(() => {}) // fallback na localStorage ako Strapi nije dostupan
  }, [period])

  // Spremi u localStorage odmah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData))
  }, [allData])

  // Spremi u Strapi s debounceom (1.5s) kad se mijenja unos
  const syncToStrapi = useCallback((p, data) => {
    if (!data || !Object.values(data).some(v => v !== '' && v !== 0 && v !== null)) return
    setSyncing(true)
    saveTrosak(p, data).finally(() => setSyncing(false))
  }, [])

  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      syncToStrapi(period, allData[period])
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [allData, period, syncToStrapi])

  // Spremi odmah kad se mijenja period (ne čekaj debounce)
  const handlePeriodChange = useCallback((newPeriod) => {
    clearTimeout(saveTimer.current)
    syncToStrapi(period, allData[period])
    setPeriod(newPeriod)
  }, [period, allData, syncToStrapi])

  const v = { ...INIT, ...(allData[period] || {}) }

  // Saldo prethodnog mjeseca kao polazište
  const prevSaldo = (() => {
    const sorted = Object.keys(allData).sort()
    const last = [...sorted].reverse().find(p => p < period)
    if (!last) return null
    const d = { ...INIT, ...allData[last] }
    const prihodi = n(d.pi_placa) + n(d.pi_zarada) + n(d.pi_pasivni) + n(d.pi_stipendija) + n(d.pi_ostalo)
    const rashodi =
      n(d.dom_najam) + n(d.popravci) + n(d.hrana) + n(d.djeca) +
      n(d.dom_struja) + n(d.dom_voda) + n(d.dom_plin) + n(d.dom_rezije) +
      n(d.dom_tv) + n(d.dom_net) + n(d.dom_tel) + n(d.dom_bon) +
      n(d.prij_auto) + n(d.prij_motor) + n(d.prij_bicikl) + n(d.prij_brod) + n(d.prij_drugo) +
      n(d.os_odjeca) + n(d.os_kozmetika) +
      n(d.zab_kave) + n(d.zab_ruckovi) + n(d.zab_izleti) + n(d.zab_ostalo) +
      n(d.obrazovanje) + n(d.sport_zdravlje) + n(d.ostalo) +
      n(d.pr_auto) + n(d.pr_gorivo) + n(d.pr_karta) + n(d.pr_taxi) + n(d.pr_drugo) +
      n(d.kr_kredit) + n(d.kr_leasing) + n(d.kr_kartice) + n(d.kr_rate) + n(d.kr_zajmovi)
    return { saldo: prihodi - rashodi, period: last }
  })()

  const f = key => e =>
    setAllData(prev => ({
      ...prev,
      [period]: { ...(prev[period] || {}), [key]: e.target.value },
    }))

  // ── Izračun ──────────────────────────────────────────────────────────────
  const domTotal       = n(v.dom_najam) + n(v.popravci) + n(v.hrana) + n(v.djeca)
  const tekuceTotal    = n(v.dom_struja) + n(v.dom_voda) + n(v.dom_plin) + n(v.dom_rezije)
  const pretplateTotal = n(v.dom_tv) + n(v.dom_net) + n(v.dom_tel) + n(v.dom_bon)
  const prijevozTotal  = n(v.prij_auto) + n(v.prij_motor) + n(v.prij_bicikl) + n(v.prij_brod) + n(v.prij_drugo)
  const osobnoTotal    = n(v.os_odjeca) + n(v.os_kozmetika)
  const zabavaTotal    = n(v.zab_kave) + n(v.zab_ruckovi) + n(v.zab_izleti) + n(v.zab_ostalo)

  const budgetTotal =
    domTotal + tekuceTotal + pretplateTotal + prijevozTotal +
    osobnoTotal + zabavaTotal +
    n(v.obrazovanje) + n(v.sport_zdravlje) + n(v.ostalo)

  const prometTotal   = n(v.pr_auto) + n(v.pr_gorivo) + n(v.pr_karta) + n(v.pr_taxi) + n(v.pr_drugo)
  const kreditiTotal  = n(v.kr_kredit) + n(v.kr_leasing) + n(v.kr_kartice) + n(v.kr_rate) + n(v.kr_zajmovi)
  const ukupnoRashodi = budgetTotal + prometTotal + kreditiTotal
  const prihodiTotal  = n(v.pi_placa) + n(v.pi_zarada) + n(v.pi_pasivni) + n(v.pi_stipendija) + n(v.pi_ostalo)
  const saldo         = prihodiTotal - ukupnoRashodi

  const resetMonth = () => {
    if (window.confirm(`Obrisati sve podatke za ${periodLabel(period)}?`)) {
      setAllData(prev => { const next = { ...prev }; delete next[period]; return next })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm sm:relative">
        <div className="max-w-2xl mx-auto px-4 py-2 sm:py-3">
          {/* Gornji red: naslov + resetiraj */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Praćenje troškova</h1>
            <p className="text-xs mt-0.5 text-gray-400">{syncing ? '⏳ Spremanje...' : '✓ Spremljeno'}</p>
            <button
              onClick={resetMonth}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-red-300 sm:hidden"
            >Resetiraj</button>
          </div>
          {/* Donji red na mobu / jedan red na desktopu */}
          <div className="flex items-center justify-between sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1 mx-auto sm:mx-0">
              <button
                onClick={() => handlePeriodChange(prevPeriod(period))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-all text-sm font-bold"
              >‹</button>
              <span className="text-sm font-semibold text-gray-700 w-32 text-center">
                {periodLabel(period)}
              </span>
              <button
                onClick={() => handlePeriodChange(nextPeriod(period))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-all text-sm font-bold"
              >›</button>
            </div>
          </div>
          <button
            onClick={resetMonth}
            className="hidden sm:block text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-red-300 absolute right-4 top-1/2 -translate-y-1/2"
          >Resetiraj</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ─── TROŠKOVI ──────────────────────────────────────────────────── */}
        <Card title="Troškovi" icon="💸" total={budgetTotal} headerClass="bg-orange-50 text-orange-900">

          <SubSection label="🏠 Dom" total={domTotal}
            labelClass="text-blue-600" boxClass="border-blue-100 bg-blue-50/40">
            <InputRow label="Najam / hipoteka" value={v.dom_najam} onChange={f('dom_najam')} />
            <InputRow label="🔧 Popravci i održavanje" value={v.popravci} onChange={f('popravci')} />
            <InputRow label="🛒 Hrana i ostalo" value={v.hrana} onChange={f('hrana')} />
            <InputRow label="👶 Djeca" value={v.djeca} onChange={f('djeca')} />
          </SubSection>

          <SubSection label="⚡ Tekuće" total={tekuceTotal}
            labelClass="text-sky-600" boxClass="border-sky-100 bg-sky-50/40">
            <InputRow label="Struja" value={v.dom_struja} onChange={f('dom_struja')} />
            <InputRow label="Voda" value={v.dom_voda} onChange={f('dom_voda')} />
            <InputRow label="Plin" value={v.dom_plin} onChange={f('dom_plin')} />
            <InputRow label="Režije / ostalo" value={v.dom_rezije} onChange={f('dom_rezije')} />
          </SubSection>

          <SubSection label="📡 Pretplate" total={pretplateTotal}
            labelClass="text-cyan-600" boxClass="border-cyan-100 bg-cyan-50/40">
            <InputRow label="TV" value={v.dom_tv} onChange={f('dom_tv')} />
            <InputRow label="Internet" value={v.dom_net} onChange={f('dom_net')} />
            <InputRow label="Telefon" value={v.dom_tel} onChange={f('dom_tel')} />
            <InputRow label="Bon mobitel" value={v.dom_bon} onChange={f('dom_bon')} />
          </SubSection>

          <SubSection label="🚗 Prijevoz" total={prijevozTotal}
            labelClass="text-amber-600" boxClass="border-amber-100 bg-amber-50/40">
            <InputRow label="Auto" value={v.prij_auto} onChange={f('prij_auto')} />
            <InputRow label="Motor" value={v.prij_motor} onChange={f('prij_motor')} />
            <InputRow label="Bicikl" value={v.prij_bicikl} onChange={f('prij_bicikl')} />
            <InputRow label="Brod" value={v.prij_brod} onChange={f('prij_brod')} />
            <InputRow label="Drugo" value={v.prij_drugo} onChange={f('prij_drugo')} />
          </SubSection>

          <SubSection label="👤 Osobno" total={osobnoTotal}
            labelClass="text-rose-600" boxClass="border-rose-100 bg-rose-50/40">
            <InputRow label="Odjeća" value={v.os_odjeca} onChange={f('os_odjeca')} />
            <InputRow label="Kozmetika" value={v.os_kozmetika} onChange={f('os_kozmetika')} />
          </SubSection>

          <SubSection label="🎉 Zabava / kave / ručkovi" total={zabavaTotal}
            labelClass="text-violet-600" boxClass="border-violet-100 bg-violet-50/40">
            <InputRow label="Kave" value={v.zab_kave} onChange={f('zab_kave')} />
            <InputRow label="Ručkovi" value={v.zab_ruckovi} onChange={f('zab_ruckovi')} />
            <InputRow label="Izleti" value={v.zab_izleti} onChange={f('zab_izleti')} />
            <InputRow label="Ostalo" value={v.zab_ostalo} onChange={f('zab_ostalo')} />
          </SubSection>

          <SubSection label="📦 Ostalo" total={n(v.obrazovanje) + n(v.sport_zdravlje) + n(v.ostalo)}
            labelClass="text-gray-500" boxClass="border-gray-100 bg-gray-50/50">
            <InputRow label="📚 Obrazovanje (seminari, tečajevi)" value={v.obrazovanje} onChange={f('obrazovanje')} />
            <InputRow label="🏃 Sport i zdravlje" value={v.sport_zdravlje} onChange={f('sport_zdravlje')} />
            <InputRow label="Ostalo / drugo" value={v.ostalo} onChange={f('ostalo')} />
          </SubSection>
        </Card>

        {/* ─── PROMET ────────────────────────────────────────────────────── */}
        <Card title="Promet" icon="🚦" total={prometTotal} headerClass="bg-indigo-50 text-indigo-900">
          <SubSection label="🚘 Troškovi prijevoza" total={prometTotal}
            labelClass="text-indigo-600" boxClass="border-indigo-100 bg-indigo-50/40">
            <InputRow label="Troškovi auta" value={v.pr_auto} onChange={f('pr_auto')} />
            <InputRow label="Gorivo" value={v.pr_gorivo} onChange={f('pr_gorivo')} />
            <InputRow label="Mj. karta (bus/tram...)" value={v.pr_karta} onChange={f('pr_karta')} />
            <InputRow label="Taxi / Uber" value={v.pr_taxi} onChange={f('pr_taxi')} />
            <InputRow label="Drugo" value={v.pr_drugo} onChange={f('pr_drugo')} />
          </SubSection>
        </Card>

        {/* ─── KREDITI ───────────────────────────────────────────────────── */}
        <Card title="Krediti" icon="💳" total={kreditiTotal} headerClass="bg-red-50 text-red-900">
          <SubSection label="📋 Obveze" total={kreditiTotal}
            labelClass="text-red-600" boxClass="border-red-100 bg-red-50/40">
            <InputRow label="Kredit" value={v.kr_kredit} onChange={f('kr_kredit')} />
            <InputRow label="Leasing" value={v.kr_leasing} onChange={f('kr_leasing')} />
            <InputRow label="Stanje kreditnih kartica" value={v.kr_kartice} onChange={f('kr_kartice')} />
            <InputRow label="Rate" value={v.kr_rate} onChange={f('kr_rate')} />
            <InputRow label="Osobni zajmovi" value={v.kr_zajmovi} onChange={f('kr_zajmovi')} />
          </SubSection>
        </Card>

        {/* ─── PRIHODI ───────────────────────────────────────────────────── */}
        <Card title="Prihodi" icon="💰" total={prihodiTotal} headerClass="bg-green-50 text-green-900">
          <SubSection label="💵 Prihodi" total={prihodiTotal}
            labelClass="text-green-600" boxClass="border-green-100 bg-green-50/40">
            <InputRow label="Plaća" value={v.pi_placa} onChange={f('pi_placa')} />
            <InputRow label="Dodatna zarada" value={v.pi_zarada} onChange={f('pi_zarada')} />
            <InputRow label="Pasivni prihod" value={v.pi_pasivni} onChange={f('pi_pasivni')} />
            <InputRow label="Stipendija" value={v.pi_stipendija} onChange={f('pi_stipendija')} />
            <InputRow label="Ostalo" value={v.pi_ostalo} onChange={f('pi_ostalo')} />
          </SubSection>
        </Card>

        {/* ─── PREGLED / SALDO ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">📊 Pregled — {periodLabel(period)}</h2>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {prevSaldo !== null && (
              <div className={`flex items-center justify-between pb-2.5 border-b border-dashed ${prevSaldo.saldo >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                <span className="text-xs text-gray-400">Saldo iz {periodLabel(prevSaldo.period)}</span>
                <span className={`text-sm font-semibold tabular-nums ${prevSaldo.saldo >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {prevSaldo.saldo >= 0 ? '+' : ''}{fmt(prevSaldo.saldo)} €
                </span>
              </div>
            )}
            <Row label="Ukupni prihodi" value={fmt(prihodiTotal)} color="text-green-600" sign="+" />
            <div className="border-t border-gray-100 pt-2.5 space-y-2">
              <Row label="Troškovi" value={fmt(budgetTotal)} color="text-orange-500" sign="−" />
              <Row label="Promet" value={fmt(prometTotal)} color="text-indigo-500" sign="−" />
              <Row label="Krediti" value={fmt(kreditiTotal)} color="text-red-500" sign="−" />
            </div>
            <div className="border-t border-gray-200 pt-2.5">
              <Row label="Ukupni rashodi" value={fmt(ukupnoRashodi)} color="text-red-500" sign="−" bold />
            </div>
            <div className={`rounded-xl p-4 mt-1 flex items-center justify-between ${saldo >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className={`font-semibold ${saldo >= 0 ? 'text-green-800' : 'text-red-800'}`}>Saldo</span>
              <span className={`text-2xl font-bold tabular-nums ${saldo >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {saldo >= 0 ? '+' : ''}{fmt(saldo)} €
              </span>
            </div>
          </div>
        </div>

        {/* ─── UŠTEDJEVINA ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-teal-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-teal-50 border-b border-teal-100 flex items-center gap-2.5">
            <span className="text-xl">🏦</span>
            <h2 className="text-lg font-bold text-teal-900">Uštedjevina</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="text-sm text-gray-600 shrink-0">Štedim za</label>
              <input
                type="text"
                value={v.st_za}
                onChange={f('st_za')}
                placeholder="npr. auto, odmor, hitni fond..."
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder-gray-300"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-gray-400">Želim uštedjeti</label>
                <div className="relative flex items-center">
                  <input
                    type="number" min="0" step="0.01"
                    value={v.st_iznos} onChange={f('st_iznos')}
                    placeholder="0"
                    className="w-full text-right pr-7 pl-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all placeholder-gray-300"
                  />
                  <span className="absolute right-2.5 text-xs text-gray-400 pointer-events-none">€</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-gray-400">Štedim do</label>
                <input
                  type="date" value={v.st_do} onChange={f('st_do')}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
            {(n(v.st_iznos) > 0 && v.st_do) && (
              <SavingsInfo iznos={n(v.st_iznos)} datumStr={v.st_do} saldo={saldo} />
            )}
          </div>
        </div>

        <footer className="text-center text-xs text-gray-400 pb-6 pt-2 space-y-1">
          <p>Podaci se čuvaju lokalno u pregledniku</p>
          <p>
            © {new Date().getFullYear()}{' '}
            <a
              href="https://anamsveric.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Anamaria Sverić
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

function Row({ label, value, color, sign, bold = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm text-gray-500 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`text-sm tabular-nums font-semibold ${color}`}>{sign} {value} €</span>
    </div>
  )
}

function SavingsInfo({ iznos, datumStr, saldo }) {
  const today = new Date()
  const target = new Date(datumStr)
  const diffMs = target - today
  if (diffMs <= 0) return null

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.max(1, Math.round(diffDays / 30))
  const perMonth = iznos / diffMonths

  return (
    <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-teal-700">Potrebno mjesečno</span>
        <span className="font-bold text-teal-800 tabular-nums">{fmt(perMonth)} €</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-teal-700">Preostalo do cilja</span>
        <span className="font-semibold text-teal-700 tabular-nums">{diffMonths} mj. ({diffDays} dana)</span>
      </div>
      {saldo > 0 && (
        <div className="flex justify-between text-sm border-t border-teal-100 pt-1.5 mt-1">
          <span className="text-teal-600">Od trenutnog salda ostaje</span>
          <span className={`font-semibold tabular-nums ${saldo - perMonth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {fmt(saldo - perMonth)} €
          </span>
        </div>
      )}
    </div>
  )
}
