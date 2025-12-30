import CreateStationPage from "../components/station-create";
import { useStationActions } from "@/hooks/use-station";
export default function Page(){
    const { createStation } = useStationActions({hasToken: true});
    return <CreateStationPage onCreate={createStation}/>;
}