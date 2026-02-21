// src/components/ApiStatus.tsx
import { useEffect, useState } from "react";
import API from "@/lib/api";

export default function ApiStatus() {
  const [status, setStatus] = useState<string>("Checking API...");

  useEffect(() => {
    let mounted = true;
    API.health()
      .then((res) => mounted && setStatus(`✅ API Connected`))
      .catch((err) => mounted && setStatus(`❌ API not reachable: ${err.message}`));
    return () => {
      mounted = false;
    };
  }, []);

  return <div className="text-sm text-muted-foreground">{status}</div>;
}
