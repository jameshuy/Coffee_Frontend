import { useEffect } from "react";

interface ExternalRedirect {
  to: string;
}

export default function ExternalRedirect({
  to
}: ExternalRedirect) {
  useEffect(() => {
    window.location.href = to; // full reload, works cross-origin
  }, [to]);

  return null; // nothing to render
}