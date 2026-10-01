import Link from "next/link";
import { REASON_LABELS } from "@/lib/security/unusual-traffic";

type EventRow = {
  id: string;
  createdAt: string;
  reason: string;
  ip: string;
  userAgent: string | null;
  path: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  user: { id: string; email: string; username: string; name: string } | null;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "medium" });
}

export function UnusualTrafficTab({ events }: { events: EventRow[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/5 bg-bg-secondary p-10 text-sm text-gray-400">
        No hay eventos de tráfico inusual.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Inspección del navegador, atajos de desarrollador o clientes de intercepción. Cada fila guarda IP, momento y cuenta si había sesión.
      </p>
      <div className="overflow-x-auto rounded-[2rem] border border-white/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-widest text-gray-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Cuándo</th>
              <th className="px-5 py-4 font-semibold">Motivo</th>
              <th className="px-5 py-4 font-semibold">IP</th>
              <th className="px-5 py-4 font-semibold">Cuenta</th>
              <th className="px-5 py-4 font-semibold">Ruta</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const account = event.user || (event.userEmail ? { email: event.userEmail, name: event.userName, username: "", id: event.userId || "" } : null);
              return (
                <tr key={event.id} className="border-t border-white/5 align-top">
                  <td className="px-5 py-4 whitespace-nowrap text-gray-300">{when(event.createdAt)}</td>
                  <td className="px-5 py-4 text-gold">{REASON_LABELS[event.reason] || event.reason}</td>
                  <td className="px-5 py-4 font-mono text-xs text-white">{event.ip}</td>
                  <td className="px-5 py-4">
                    {account ? (
                      <div>
                        <p className="text-white">{account.name || account.email}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                        {account.id && (
                          <Link href={`/perfil/${account.id}`} className="text-xs text-gold hover:underline">
                            Ver perfil
                          </Link>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">Sin sesión</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    <p>{event.path || "—"}</p>
                    {event.userAgent && <p className="mt-1 max-w-xs truncate" title={event.userAgent}>{event.userAgent}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
