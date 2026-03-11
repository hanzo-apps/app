import insights from '@hanzo/insights'
import { useEffect } from 'react'

import { getAppDistinctId, updateDistinctId } from '@/services/analytic'
import { useAnalytic } from '@/hooks/useAnalytic'

export function AnalyticProvider() {
  const { productAnalytic } = useAnalytic()

  useEffect(() => {
    if (!INSIGHTS_KEY || !INSIGHTS_HOST) {
      console.warn(
        'Insights not initialized: Missing INSIGHTS_KEY or INSIGHTS_HOST environment variables'
      )
      return
    }
    if (productAnalytic) {
      insights.init(INSIGHTS_KEY, {
        api_host: INSIGHTS_HOST,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        person_profiles: 'always',
        persistence: 'localStorage',
        opt_out_capturing_by_default: true,

        sanitize_properties: function (properties) {
          const denylist = [
            '$pathname',
            '$initial_pathname',
            '$current_url',
            '$initial_current_url',
            '$host',
            '$initial_host',
            '$initial_person_info',
          ]

          denylist.forEach((key) => {
            if (properties[key]) {
              properties[key] = null // Set each denied property to null
            }
          })

          return properties
        },
      })
      // Attempt to restore distinct Id from app global settings
      getAppDistinctId()
        .then((id) => {
          if (id) insights.identify(id)
        })
        .finally(() => {
          insights.opt_in_capturing()
          insights.register({ app_version: VERSION })
          updateDistinctId(insights.get_distinct_id())
        })
    } else {
      insights.opt_out_capturing()
    }
  }, [productAnalytic])

  // This component doesn't render anything
  return null
}
