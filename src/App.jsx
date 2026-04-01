import { useMemo, useState } from 'react'
import './App.css'

const CHAINS = [
  { id: '1', label: 'Ethereum' },
  { id: '56', label: 'BNB Chain' },
  { id: '8453', label: 'Base' },
  { id: '137', label: 'Polygon' },
  { id: '42161', label: 'Arbitrum' },
]

const FLAG_DEFINITIONS = [
  { key: 'IS_OPEN_SOURCE', label: 'Open source', riskWhen: false },
  { key: 'IS_PROXY', label: 'Proxy contract', riskWhen: true },
  { key: 'IS_MINTABLE', label: 'Mintable', riskWhen: true },
  { key: 'CAN_TAKE_BACK_OWNERSHIP', label: 'Can take back ownership', riskWhen: true },
  { key: 'OWNER_CHANGE_BALANCE', label: 'Owner can change balance', riskWhen: true },
  { key: 'HIDDEN_OWNER', label: 'Hidden owner', riskWhen: true },
  { key: 'SELFDESTRUCT', label: 'Selfdestruct enabled', riskWhen: true },
  { key: 'IS_HONEYPOT', label: 'Honeypot', riskWhen: true },
  { key: 'TRANSFER_PAUSABLE', label: 'Transfers pausable', riskWhen: true },
  { key: 'BUY_TAX', label: 'Buy tax > 10%', riskWhen: true },
  { key: 'SELL_TAX', label: 'Sell tax > 10%', riskWhen: true },
  { key: 'LP_LOCKED', label: 'LP locked', riskWhen: false },
]

const EXAMPLES = [
  {
    label: 'USDT on Ethereum',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chainId: '1',
    data: {
      tokenName: 'Tether USD',
      symbol: 'USDT',
      holderCount: '7,160,000+',
      supply: '144,400,000,000',
      creatorAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      flags: {
        IS_OPEN_SOURCE: true,
        IS_PROXY: true,
        IS_MINTABLE: true,
        CAN_TAKE_BACK_OWNERSHIP: false,
        OWNER_CHANGE_BALANCE: false,
        HIDDEN_OWNER: false,
        SELFDESTRUCT: false,
        IS_HONEYPOT: false,
        TRANSFER_PAUSABLE: true,
        BUY_TAX: false,
        SELL_TAX: false,
        LP_LOCKED: true,
      },
    },
  },
  {
    label: 'SHIB on Ethereum',
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    chainId: '1',
    data: {
      tokenName: 'Shiba Inu',
      symbol: 'SHIB',
      holderCount: '1,390,000+',
      supply: '589,249,918,124,129',
      creatorAddress: '0xdead000000000000000042069420694206942069',
      flags: {
        IS_OPEN_SOURCE: true,
        IS_PROXY: false,
        IS_MINTABLE: false,
        CAN_TAKE_BACK_OWNERSHIP: false,
        OWNER_CHANGE_BALANCE: false,
        HIDDEN_OWNER: false,
        SELFDESTRUCT: false,
        IS_HONEYPOT: false,
        TRANSFER_PAUSABLE: false,
        BUY_TAX: false,
        SELL_TAX: false,
        LP_LOCKED: true,
      },
    },
  },
  {
    label: 'CAKE on BNB Chain',
    address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    chainId: '56',
    data: {
      tokenName: 'PancakeSwap Token',
      symbol: 'CAKE',
      holderCount: '1,930,000+',
      supply: '371,000,000',
      creatorAddress: '0x73feaa1ee314f8c655e354234017be2193c9e24e',
      flags: {
        IS_OPEN_SOURCE: true,
        IS_PROXY: false,
        IS_MINTABLE: true,
        CAN_TAKE_BACK_OWNERSHIP: false,
        OWNER_CHANGE_BALANCE: false,
        HIDDEN_OWNER: false,
        SELFDESTRUCT: false,
        IS_HONEYPOT: false,
        TRANSFER_PAUSABLE: false,
        BUY_TAX: false,
        SELL_TAX: false,
        LP_LOCKED: true,
      },
    },
  },
]

const INITIAL_FORM = {
  address: '',
  chainId: '1',
}

function normalizeAddress(value) {
  return value.trim()
}

function isValidAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

function scoreFromFlags(flags) {
  const triggered = FLAG_DEFINITIONS.filter(({ key, riskWhen }) => flags[key] === riskWhen).length
  return Math.round((triggered / FLAG_DEFINITIONS.length) * 100)
}

function getBadge(score) {
  if (score <= 20) return { label: 'SAFE', tone: 'safe' }
  if (score <= 40) return { label: 'CAUTION', tone: 'caution' }
  if (score <= 65) return { label: 'RISKY', tone: 'risky' }
  return { label: 'DANGEROUS', tone: 'danger' }
}

function formatNumberish(value) {
  if (!value || value === '0') return 'Unknown'
  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    return new Intl.NumberFormat('en-US').format(numeric)
  }
  return value
}

function parseBoolean(value) {
  if (value === '1' || value === 1 || value === true || value === 'true') return true
  if (value === '0' || value === 0 || value === false || value === 'false' || value === null) return false
  return false
}

function parseTaxRisk(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return false
  return numeric > 0.1 || numeric > 10
}

function mapGoPlusData(raw) {
  return {
    tokenName: raw.token_name || 'Unknown token',
    symbol: raw.token_symbol || 'N/A',
    holderCount: formatNumberish(raw.holder_count),
    supply: formatNumberish(raw.total_supply),
    creatorAddress: raw.creator_address || raw.owner_address || 'Unknown',
    flags: {
      IS_OPEN_SOURCE: parseBoolean(raw.is_open_source),
      IS_PROXY: parseBoolean(raw.is_proxy),
      IS_MINTABLE: parseBoolean(raw.is_mintable),
      CAN_TAKE_BACK_OWNERSHIP: parseBoolean(raw.can_take_back_ownership),
      OWNER_CHANGE_BALANCE: parseBoolean(raw.owner_change_balance),
      HIDDEN_OWNER: parseBoolean(raw.hidden_owner),
      SELFDESTRUCT: parseBoolean(raw.selfdestruct),
      IS_HONEYPOT: parseBoolean(raw.is_honeypot),
      TRANSFER_PAUSABLE: parseBoolean(raw.transfer_pausable),
      BUY_TAX: parseTaxRisk(raw.buy_tax),
      SELL_TAX: parseTaxRisk(raw.sell_tax),
      LP_LOCKED: parseBoolean(raw.is_locked) || parseBoolean(raw.lp_locked) || parseBoolean(raw.locked_lp),
    },
  }
}

function App() {
  const [theme, setTheme] = useState('dark')
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [walletError, setWalletError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const badge = useMemo(() => (result ? getBadge(result.score) : null), [result])

  const reset = () => {
    setForm(INITIAL_FORM)
    setError('')
    setWalletError(false)
    setResult(null)
    setLoading(false)
  }

  const fillExample = (example) => {
    setForm({ address: example.address, chainId: example.chainId })
    setError('')
    setWalletError(false)
    setResult(null)
  }

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field === 'address') {
      setError('')
      setWalletError(false)
    }
  }

  const runCheck = async () => {
    const address = normalizeAddress(form.address)

    if (!isValidAddress(address)) {
      setError('Enter a valid contract address in 0x... format.')
      setResult(null)
      setWalletError(false)
      return
    }

    const example = EXAMPLES.find(
      (item) => item.address.toLowerCase() === address.toLowerCase() && item.chainId === form.chainId,
    )

    setLoading(true)
    setError('')
    setWalletError(false)
    setResult(null)

    try {
      if (example) {
        const score = scoreFromFlags(example.data.flags)
        setResult({
          ...example.data,
          address,
          chainId: form.chainId,
          score,
        })
        return
      }

      const targetUrl = encodeURIComponent(
        `https://api.gopluslabs.io/api/v1/token_security/${form.chainId}?contract_addresses=${address}`,
      )
      const response = await fetch(`https://api.allorigins.win/get?url=${targetUrl}`)
      const payload = await response.json()
      const parsed = JSON.parse(payload.contents)
      const tokenData = parsed?.result?.[address.toLowerCase()] || parsed?.result?.[address]

      if (!tokenData || !tokenData.token_name) {
        setWalletError(true)
        return
      }

      const mapped = mapGoPlusData(tokenData)
      const score = scoreFromFlags(mapped.flags)
      setResult({ ...mapped, address, chainId: form.chainId, score })
    } catch (fetchError) {
      setError('Could not fetch security data right now. Try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`app theme-${theme}`}>
      <nav className="navbar">
        <div className="brand">RUGCHECKER</div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
        </button>
      </nav>

      <main className="main-content">
        <section className="hero-block">
          <p className="eyebrow">Fast token contract screening</p>
          <h1>
            <span>Is this token</span>
            <span className="accent">a rug pull?</span>
          </h1>
          <p className="subcopy">
            Paste a contract, pick the chain, and get a quick risk read across core smart-contract red flags.
          </p>
        </section>

        <section className="checker-card">
          <div className="input-stack">
            <input
              type="text"
              placeholder="Paste contract address (0x...)"
              value={form.address}
              onChange={(event) => handleChange('address', event.target.value)}
            />
            <div className="action-row">
              <select value={form.chainId} onChange={(event) => handleChange('chainId', event.target.value)}>
                {CHAINS.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.label} ({chain.id})
                  </option>
                ))}
              </select>
              <button type="button" className="check-button" onClick={runCheck} disabled={loading}>
                CHECK TOKEN
              </button>
            </div>
            {error ? <p className="inline-error">{error}</p> : null}
            <div className="example-row">
              {EXAMPLES.map((example) => (
                <button key={example.label} type="button" className="example-chip" onClick={() => fillExample(example)}>
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <section className="status-card loading-card">
            <div className="pulse-dot" />
            <p>SCANNING CONTRACT...</p>
          </section>
        ) : null}

        {walletError ? (
          <section className="status-card wallet-error shake">
            <h2>This is not a contract address.</h2>
            <p>Please make sure you are inputing a contract address.</p>
            <div className="example-row centered">
              {EXAMPLES.map((example) => (
                <button key={example.label} type="button" className="example-chip" onClick={() => fillExample(example)}>
                  {example.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {result ? (
          <section className="results-card fade-up">
            <div className="results-header">
              <div>
                <p className="meta-label">Token</p>
                <h2>
                  {result.tokenName} <span>({result.symbol})</span>
                </h2>
              </div>
              <div className={`badge badge-${badge.tone}`}>{badge.label}</div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <span>Name</span>
                <strong>{result.tokenName}</strong>
              </div>
              <div className="stat-item">
                <span>Symbol</span>
                <strong>{result.symbol}</strong>
              </div>
              <div className="stat-item">
                <span>Holder count</span>
                <strong>{result.holderCount}</strong>
              </div>
              <div className="stat-item">
                <span>Supply</span>
                <strong>{result.supply}</strong>
              </div>
              <div className="stat-item wide">
                <span>Creator address</span>
                <strong>{result.creatorAddress}</strong>
              </div>
              <div className="stat-item">
                <span>Risk score</span>
                <strong>{result.score}/100</strong>
              </div>
              <div className="stat-item">
                <span>Unsafe</span>
                <strong>{result.score}%</strong>
              </div>
              <div className="stat-item">
                <span>Safe</span>
                <strong>{100 - result.score}%</strong>
              </div>
            </div>

            <div className="flags-grid">
              {FLAG_DEFINITIONS.map((flag) => {
                const value = result.flags[flag.key]
                const risky = value === flag.riskWhen
                return (
                  <div key={flag.key} className="flag-card">
                    <span>{flag.label}</span>
                    <strong className={risky ? 'flag-risk' : 'flag-safe'}>{value ? 'YES' : 'NO'}</strong>
                  </div>
                )
              })}
            </div>

            <button type="button" className="reset-button" onClick={reset}>
              Check Another Token
            </button>
          </section>
        ) : null}
      </main>

      <footer className="footer">
        Built by{' '}
        <a href="https://x.com/kane_120" target="_blank" rel="noreferrer">
          Kane
        </a>
      </footer>
    </div>
  )
}

export default App
