// La caja personal de antes. La de Mercav Business usa la misma pantalla en /business/[slug]/caja.
import { PosPersonalScope } from "@/components/pos/PosWorkspaceScope";
import SaleScreen from "@/components/pos/screens/SaleScreen";

export default function Page() {
  return (
    <PosPersonalScope>
      <SaleScreen />
    </PosPersonalScope>
  );
}
// creado por pato dev y askforvini
