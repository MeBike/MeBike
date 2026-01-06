import StationDetailClient from "./StationDetailClient";
export default function Page({ params }: { params: Promise<{ stationId: string }> }) {
  return <StationDetailClient params={params} />;
}