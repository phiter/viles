import { useMemo, useState } from 'react'
import './App.css'

const HUMAN_FACTIONS = ['Incense', 'Jadeon', 'Lupin', 'Modo', 'Skysong', 'Vim']
const ATHAN_FACTIONS = ['Arden', 'Balo', 'Celan', 'Forta', 'Rayan', 'Voida']
const REALM_COUNT = 14
const REALMS = Array.from({ length: REALM_COUNT }, (_, index) => index + 1)

function App() {
  const [realmSelections, setRealmSelections] = useState<string[]>(
    Array.from({ length: REALM_COUNT }, () => ''),
  )
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'failed'>('idle')
  const hasAnySelection = useMemo(
    () => realmSelections.some((selection) => selection.trim().length > 0),
    [realmSelections],
  )

  const setSelectionForRealm = (realmNumber: number, faction: string) => {
    setRealmSelections((previousSelections) => {
      const nextSelections = [...previousSelections]
      nextSelections[realmNumber - 1] = faction
      return nextSelections
    })

    if (copyState !== 'idle') {
      setCopyState('idle')
    }

    if (shareState !== 'idle') {
      setShareState('idle')
    }
  }

  const buildExportPayload = () =>
    realmSelections
      .map((faction, index) => ({ realmNumber: index + 1, faction: faction.trim() }))
      .filter(({ faction }) => faction.length > 0)
      .map(({ realmNumber, faction }) => `${realmNumber} ${faction}`)
      .join('\n')

  const copySelections = async () => {
    if (!hasAnySelection) {
      return
    }

    const payload = buildExportPayload()

    try {
      await navigator.clipboard.writeText(payload)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const shareToDiscord = async () => {
    if (!hasAnySelection) {
      return
    }

    const payload = buildExportPayload()

    if (typeof navigator.share !== 'function') {
      setShareState('failed')
      return
    }

    try {
      await navigator.share({
        title: 'Realm Faction Picks',
        text: payload,
      })
      setShareState('shared')
    } catch {
      setShareState('failed')
    }
  }

  return (
    <main className="page">
      <div className="ornament ornament-top" aria-hidden="true" />
      <div className="ornament ornament-bottom" aria-hidden="true" />

      <section className="card">
        <header className="header">
          <p className="eyebrow">Jade Dynasty Realm Picker</p>
          <h1>Choose A Faction For All 14 Realms</h1>
          <p className="subtext">Pick one faction per realm. Then copy the final lineup in one tap.</p>
        </header>

        <ul className="realm-list" aria-label="Realm faction picks">
          {REALMS.map((realmNumber) => (
            <li
              className={`realm-row ${realmSelections[realmNumber - 1] ? 'completed' : ''}`}
              key={realmNumber}
            >
              <fieldset className="realm-fieldset">
                <legend className="realm-title">Realm {realmNumber}</legend>
                <div className="faction-columns">
                  <section className="faction-column" aria-label={`Realm ${realmNumber} Human factions`}>
                    <p className="faction-heading">Human</p>
                    <div className="radio-list">
                      {HUMAN_FACTIONS.map((faction) => (
                        <label
                          className={`radio-option ${realmSelections[realmNumber - 1] === faction ? 'selected' : ''}`}
                          key={`${realmNumber}-human-${faction}`}
                        >
                          <input
                            type="radio"
                            name={`realm-${realmNumber}`}
                            value={faction}
                            checked={realmSelections[realmNumber - 1] === faction}
                            onChange={(event) => setSelectionForRealm(realmNumber, event.target.value)}
                          />
                          <span>{faction}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="faction-column" aria-label={`Realm ${realmNumber} Athan factions`}>
                    <p className="faction-heading">Athan</p>
                    <div className="radio-list">
                      {ATHAN_FACTIONS.map((faction) => (
                        <label
                          className={`radio-option ${realmSelections[realmNumber - 1] === faction ? 'selected' : ''}`}
                          key={`${realmNumber}-athan-${faction}`}
                        >
                          <input
                            type="radio"
                            name={`realm-${realmNumber}`}
                            value={faction}
                            checked={realmSelections[realmNumber - 1] === faction}
                            onChange={(event) => setSelectionForRealm(realmNumber, event.target.value)}
                          />
                          <span>{faction}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                </div>
              </fieldset>
            </li>
          ))}
        </ul>

        <footer className="footer">
          <div className="button-row">
            <button type="button" onClick={copySelections} disabled={!hasAnySelection}>
              Copy list
            </button>
            <button type="button" onClick={shareToDiscord} disabled={!hasAnySelection}>
              Share
            </button>
          </div>
          {!hasAnySelection && <p className="hint">Choose at least one realm to copy or share.</p>}
          {copyState === 'copied' && <p className="hint success">Copied to clipboard.</p>}
          {copyState === 'failed' && (
            <p className="hint error">Copy failed. Check browser permissions and try again.</p>
          )}
          {shareState === 'failed' && (
            <p className="hint error">Share unavailable on this browser/device. Use Copy instead.</p>
          )}
        </footer>
      </section>
    </main>
  )
}

export default App
