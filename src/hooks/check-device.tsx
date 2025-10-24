import * as React from "react"

export function useDeviceInfo() {
    const [deviceInfo, setDeviceInfo] = React.useState({
        isMobile: false,
        os: "unknown" as "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "unknown",
    })

    React.useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
        const ua = userAgent.toLowerCase()

        let os: typeof deviceInfo.os = "unknown"
        let isMobile = false

        if (/android/i.test(ua)) {
            os = "Android"
            isMobile = true
        } else if (/iphone|ipad|ipod/i.test(ua)) {
            os = "iOS"
            isMobile = true
        } else if (/win/i.test(ua)) {
            os = "Windows"
        } else if (/mac/i.test(ua)) {
            os = "macOS"
        } else if (/linux/i.test(ua)) {
            os = "Linux"
        }

        setDeviceInfo({ os, isMobile })
    }, [])

    return deviceInfo
}