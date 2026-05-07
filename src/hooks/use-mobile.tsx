
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(mql.matches)

    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    mql.addEventListener("change", onChange)

    return () => {
      mql.removeEventListener("change", onChange)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  return !!isMobile
}
