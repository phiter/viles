import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'
import {
  buildExportPayload,
  getFactionImagesFromModules,
  getStoredBoolean,
} from './realmHelpers'
import { preloadImageUrls, scrollElementToViewportCenter, scrollToTop } from './uiHelpers'

const HUMAN_FACTIONS = ['Incense', 'Jadeon', 'Lupin', 'Modo', 'Skysong', 'Vim']
const ATHAN_FACTIONS = ['Arden', 'Balo', 'Celan', 'Forta', 'Rayan', 'Voida']
const REALM_COUNT = 14
const REALMS = Array.from({ length: REALM_COUNT }, (_, index) => index + 1)
const DARK_MODE_STORAGE_KEY = 'viles-dark-mode'
const AUTO_SCROLL_STORAGE_KEY = 'viles-auto-scroll'
const factionImageModules = import.meta.glob('./factions/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const FACTION_IMAGES = getFactionImagesFromModules(factionImageModules)

function App() {
  const [realmSelections, setRealmSelections] = useState<string[]>(
    Array.from({ length: REALM_COUNT }, () => ''),
  )
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'failed'>('idle')
  const [factionAnimationPhase, setFactionAnimationPhase] = useState<number[]>(
    Array.from({ length: REALM_COUNT }, () => 0),
  )
  const realmRowRefs = useRef<Array<HTMLLIElement | null>>([])
  const [isDark, setIsDark] = useState(() => {
    const storedIsDark = getStoredBoolean(DARK_MODE_STORAGE_KEY)
    if (storedIsDark !== null) {
      return storedIsDark
    }

    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(
    () => getStoredBoolean(AUTO_SCROLL_STORAGE_KEY) ?? true,
  )
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    globalThis.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDark))
  }, [isDark])

  useEffect(() => {
    globalThis.localStorage.setItem(AUTO_SCROLL_STORAGE_KEY, String(isAutoScrollEnabled))
  }, [isAutoScrollEnabled])

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(globalThis.scrollY > 320)
    }

    onScroll()
    globalThis.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      globalThis.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => preloadImageUrls(Object.values(FACTION_IMAGES)), [])

  const hasAnySelection = useMemo(
    () => realmSelections.some((selection) => selection.trim().length > 0),
    [realmSelections],
  )

  const setSelectionForRealm = (realmNumber: number, faction: string) => {
    const realmIndex = realmNumber - 1

    if (realmSelections[realmIndex] !== faction) {
      setFactionAnimationPhase((previousPhases) => {
        const nextPhases = [...previousPhases]
        nextPhases[realmIndex] = nextPhases[realmIndex] === 0 ? 1 : 0
        return nextPhases
      })
    }

    setRealmSelections((previousSelections) => {
      const nextSelections = [...previousSelections]
      nextSelections[realmIndex] = faction
      return nextSelections
    })

    if (copyState !== 'idle') {
      setCopyState('idle')
    }

    if (shareState !== 'idle') {
      setShareState('idle')
    }

    const nextRealmRow = realmRowRefs.current[realmNumber]
    if (isAutoScrollEnabled && nextRealmRow) {
      scrollElementToViewportCenter(nextRealmRow)
    }
  }

  const copySelections = async () => {
    if (!hasAnySelection) {
      return
    }

    const payload = buildExportPayload(realmSelections)

    try {
      await navigator.clipboard.writeText(payload)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const openShareDialog = async () => {
    if (!hasAnySelection) {
      return
    }

    const payload = buildExportPayload(realmSelections)

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
          <div className="header-top">
            <p className="eyebrow">Jade Dynasty Realm Picker</p>
            <div className="toggle-group">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setIsAutoScrollEnabled((enabled) => !enabled)}
                aria-pressed={isAutoScrollEnabled}
                aria-label={isAutoScrollEnabled ? 'Disable auto scroll' : 'Enable auto scroll'}
              >
                Auto-scroll: {isAutoScrollEnabled ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setIsDark((dark) => !dark)}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
          <h1>Pick a faction for each realm</h1>
          <p className="subtext">Pick one faction per realm. Then copy the final lineup in one tap.</p>
        </header>

        <ul className="realm-list" aria-label="Realm faction picks">
          {REALMS.map((realmNumber) => {
            const selectedFaction = realmSelections[realmNumber - 1]
            const selectedFactionImage = selectedFaction ? FACTION_IMAGES[selectedFaction] : ''
            const realmRowStyle = selectedFactionImage
              ? ({
                  '--faction-image': `url("${selectedFactionImage}")`,
                } as CSSProperties)
              : undefined

            return (
            <li
              className={`realm-row ${selectedFaction ? 'completed has-faction-art faction-anim-' + factionAnimationPhase[realmNumber - 1] : ''}`}
              key={realmNumber}
              ref={(element) => {
                realmRowRefs.current[realmNumber - 1] = element
              }}
              style={realmRowStyle}
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
            )
          })}
        </ul>

        <footer className="footer">
          <div className="button-row">
            <button type="button" onClick={copySelections} disabled={!hasAnySelection}>
              Copy list
            </button>
            <button type="button" onClick={openShareDialog} disabled={!hasAnySelection}>
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

      {showBackToTop && (
        <button type="button" className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
          ↑
        </button>
      )}
    </main>
  )
}

export default App
