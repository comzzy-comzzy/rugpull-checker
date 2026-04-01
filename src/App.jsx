import { useMemo, useState } from 'react'
import './App.css'

const CHAINS = [
  { id: '1', label: 'Ethereum', short: 'ETH' },
  { id: '56', label: 'BNB Chain', short: 'BNB' },
  { id: '8453', label: 'Base', short: 'BASE' },
  { id: '137', label: 'Polygon', short: 'POLY' },
  { id: '42161', label: 'Arbitrum', short: 'ARB' },
]

const FLAG_DEFINITIONS = [
  {
    key: 'IS_OPEN_SOURCE',
    label: 'Open source',
    riskWhen: false,
    tooltip: 'If the contract is not open source, buyers cannot easily inspect the code for hidden risks.',
  },
  {
    key: 'IS_PROXY',
    label: 'Proxy contract',
    riskWhen: true,
    tooltip: 'Proxy contracts can be upgraded later, which may let the owner change behavior after launch.',
  },
  {
    key: 'IS_MINTABLE',
    label: 'Mintable',
    riskWhen: true,
    tooltip: 'Mintable tokens can create more supply, which may dilute holders or be abused by the team.',
  },
  {
    key: 'CAN_TAKE_BACK_OWNERSHIP',
    label: 'Can take back ownership',
    riskWhen: true,
    tooltip: 'This suggests ownership can be reclaimed even after renouncing, which is a centralization risk.',
  },
  {
    key: 'OWNER_CHANGE_BALANCE',
    label: 'Owner can change balance',
    riskWhen: true,
    tooltip: 'If true, the owner may be able to alter user balances directly.',
  },
  {
    key: 'HIDDEN_OWNER',
    label: 'Hidden owner',
    riskWhen: true,
    tooltip: 'A hidden owner means control may still exist even if the contract appears renounced.',
  },
  {
    key: 'SELFDESTRUCT',
    label: 'Selfdestruct enabled',
    riskWhen: true,
    tooltip: 'Selfdestruct can allow the contract to be disabled or destroyed, depending on implementation.',
  },
  {
    key: 'IS_HONEYPOT',
    label: 'Honeypot',
    riskWhen: true,
    tooltip: 'A honeypot lets users buy but blocks or punishes selling.',
  },
  {
    key: 'TRANSFER_PAUSABLE',
    label: 'Transfers pausable',
    riskWhen: true,
    tooltip: 'If transfers can be paused, the team may be able to freeze token movement.',
  },
  {
    key: 'BUY_TAX',
    label: 'Buy tax > 10%',
    riskWhen: true,
    tooltip: 'High buy tax can make entering the token expensive and may signal abusive tokenomics.',
  },
  {
    key: 'SELL_TAX',
    label: 'Sell tax > 10%',
    riskWhen: true,
    tooltip: 'High sell tax can trap users or heavily penalize exits.',
  },
  {
    key: 'LP_LOCKED',
    label: 'LP locked',
    riskWhen: false,
    tooltip: 'Locked liquidity generally reduces the chance of an immediate liquidity rug.',
  },
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

function shortenAddress(value) {
  if (!value || value === 'Unknown') return 'Unknown'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
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
  const [copiedField, setCopiedField] = useState('')

  const badge = useMemo(() => (result ? getBadge(result.score) : null), [result])
  const activeChain = useMemo(() => CHAINS.find((chain) => chain.id === result?.chainId), [result])

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

  const copyValue = async (label, value) => {
    if (!value || value === 'Unknown') return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      window.setTimeout(() => setCopiedField(''), 1600)
    } catch {
      setCopiedField('')
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

      const apiUrl = `https://api.gopluslabs.io/api/v1/token_security/${form.chainId}?contract_addresses=${address}`

      let parsed = null
      let lastError = null

      try {
        const directResponse = await fetch(apiUrl)
        if (!directResponse.ok) {
          throw new Error(`Direct GoPlus request failed with ${directResponse.status}`)
        }
        parsed = await directResponse.json()
      } catch (directError) {
        lastError = directError
        const targetUrl = encodeURIComponent(apiUrl)
        const proxyResponse = await fetch(`https://api.allorigins.win/get?url=${targetUrl}`)
        if (!proxyResponse.ok) {
          throw new Error(`Proxy request failed with ${proxyResponse.status}`)
        }
        const payload = await proxyResponse.json()
        parsed = JSON.parse(payload.contents)
      }

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
      console.error('Token check failed:', fetchError)
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
                <div className="result-topline">
                  <p className="meta-label">Token</p>
                  {activeChain ? <span className="chain-badge">{activeChain.short}</span> : null}
                </div>
                <h2>
                  {result.tokenName} <span>({result.symbol})</span>
                </h2>
                <div className="address-line">
                  <span>Contract: {shortenAddress(result.address)}</span>
                  <button type="button" className="copy-button" onClick={() => copyValue('contract', result.address)}>
                    {copiedField === 'contract' ? 'Copied' : 'Copy'}
                  </button>
                </div>
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
                <div className="address-row">
                  <strong>{result.creatorAddress}</strong>
                  <button type="button" className="copy-button" onClick={() => copyValue('creator', result.creatorAddress)}>
                    {copiedField === 'creator' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="stat-item">
                <span>Risk score</span>
                <strong>{result.score}/100</strong>
              </div>
              <div className="stat-item">
                <span>Risk level</span>
                <strong>{result.score}% risky</strong>
              </div>
              <div className="stat-item">
                <span>Safety score</span>
                <strong>{100 - result.score}% safe</strong>
              </div>
            </div>

            <div className="flags-grid">
              {FLAG_DEFINITIONS.map((flag) => {
                const value = result.flags[flag.key]
                const risky = value === flag.riskWhen
                return (
                  <div key={flag.key} className="flag-card" title={flag.tooltip}>
                    <div className="flag-title-row">
                      <span>{flag.label}</span>
                      <span className="flag-info" aria-hidden="true">?</span>
                    </div>
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
