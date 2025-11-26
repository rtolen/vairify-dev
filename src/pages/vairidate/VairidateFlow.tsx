import { useParams } from "react-router-dom";
import { VairidateRequest } from "@/components/vairidate/VairidateRequest";

export default function VairidateFlow() {
  const { providerId, providerName } = useParams<{ providerId: string; providerName: string }>();

  if (!providerId || !providerName) {
    return <div>Invalid request</div>;
  }

  return (
    <VairidateRequest 
      providerId={providerId} 
      providerName={decodeURIComponent(providerName)} 
    />
  );
}
