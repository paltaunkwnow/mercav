// La caja personal de antes. La de Mercav Business usa la misma pantalla en /business/[slug]/caja.
import { PosPersonalScope } from "@/components/pos/PosWorkspaceScope";
import InventoryScreen from "@/components/pos/screens/InventoryScreen";

export default function Page() {
  return (
    <PosPersonalScope>
      <InventoryScreen />
    </PosPersonalScope>
  );
}
// creado por pato dev y askforvini
