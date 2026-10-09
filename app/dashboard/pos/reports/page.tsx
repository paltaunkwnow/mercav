// La caja personal de antes. La de Mercav Business usa la misma pantalla en /business/[slug]/caja.
import { PosPersonalScope } from "@/components/pos/PosWorkspaceScope";
import ReportsScreen from "@/components/pos/screens/ReportsScreen";

export default function Page() {
  return (
    <PosPersonalScope>
      <ReportsScreen />
    </PosPersonalScope>
  );
}
// creado por pato dev y askforvini
