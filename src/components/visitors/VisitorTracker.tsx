'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function VisitorTracker() {
  // --- Visitors today: one visit per tab-session -------------------

  useEffect(() => {
    const existingSessionId = sessionStorage.getItem('clickbid_session_id')
    if (existingSessionId) return

    const sessionId = crypto.randomUUID()
    sessionStorage.setItem('clickbid_session_id', sessionId)

    supabase
      .from('visits')
      .insert({ session_id: sessionId })
      .then(({ error }) => {
        if (error) {
          console.error('[visits] failed to record visit', error)
          return
        }

        window.dispatchEvent(
          new CustomEvent('clickbid:visit-recorded', {
            detail: { sessionId },
          }),
        )
      })
  }, [])

  // --- Online now: browser-profile presence ------------------------

  // Bootstrap the persistent visitor ID (localStorage — shared across
  // all ClickBid tabs in this browser, survives reloads).
  useEffect(() => {
    if (localStorage.getItem('clickbid_visitor_id')) return

    localStorage.setItem('clickbid_visitor_id', crypto.randomUUID())
  }, [])

  useEffect(() => {
    const visitorId = localStorage.getItem('clickbid_visitor_id')
    if (!visitorId) return

    supabase
      .from('online_visitors')
      .upsert({ visitor_id: visitorId, last_seen: new Date().toISOString() })
      .then(({ error }) => {
        if (error) {
          console.error('[online] failed to upsert visitor', error)
        }
      })
  }, [])

  // Heartbeat + visibility refresh: keep last_seen current while
  // this browser is present. Reads the visitor ID from localStorage
  // on each write (always current; converges after the rare
  // simultaneous-tab ID-creation race). Update-only: the row is
  // created by the upsert effect, and matching zero rows is a silent
  // no-op.
  useEffect(() => {
    function refreshLastSeen() {
      const visitorId = localStorage.getItem('clickbid_visitor_id')
      if (!visitorId) return

      supabase
        .from('online_visitors')
        .update({ last_seen: new Date().toISOString() })
        .eq('visitor_id', visitorId)
        .then(({ error }) => {
          if (error) {
            console.error('[online] failed to refresh visitor', error)
          }
        })
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshLastSeen()
      }
    }

    const intervalId = setInterval(refreshLastSeen, 120_000)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
