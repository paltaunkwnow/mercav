// La caja personal de antes. La de Mercav Business usa la misma pantalla en /business/[slug]/caja.
import { PosPersonalScope } from "@/components/pos/PosWorkspaceScope";
import ConfigScreen from "@/components/pos/screens/ConfigScreen";

export default function Page() {
  return (
    <PosPersonalScope>
      <ConfigScreen />
    </PosPersonalScope>
  );
}
// creado por pato dev y askforvini
