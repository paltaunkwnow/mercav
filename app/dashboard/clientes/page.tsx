import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Users, CreditCard, Calendar, CheckCircle2, Clock, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      services: {
        include: {
          orders: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true
                }
              }
            }
          }
        }
      },
      spaces: {
        include: {
          reservations: {
            include: {
              advertiser: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) redirect('/login');

  // Combine and format orders and reservations as "Clients"
  const serviceClients = user.services.flatMap(service => 
    service.orders.map(order => ({
      id: order.id,
      clientName: order.client.name,
      clientAvatar: order.client.avatar,
      clientEmail: order.client.email,
      clientId: order.client.id,
      itemName: service.title,
      type: 'Servicio',
      price: order.totalPrice,
      status: order.status,
      date: order.createdAt
    }))
  );

  const adClients = user.spaces.flatMap(space => 
    space.reservations.map(res => ({
      id: res.id,
      clientName: res.advertiser.name,
      clientAvatar: res.advertiser.avatar,
      clientEmail: res.advertiser.email,
      clientId: res.advertiser.id,
      itemName: space.title,
      type: 'Anuncio',
      price: res.totalPrice,
      status: res.status,
      date: res.createdAt
    }))
  );

  const allClients = [...serviceClients, ...adClients].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="w-full min-h-screen pt-24 pb-32 bg-bg-primary">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-gold transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
        </Link>

        <header className="mb-12">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Cartera de Clientes</h1>
          <p className="text-gray-400">Gestiona tus pedidos y reservas activas en la plataforma.</p>
        </header>

        {allClients.length === 0 ? (
          <div className="bg-bg-secondary rounded-2xl border border-border p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Aún no tienes clientes</h3>
            <p className="text-gray-400">Tus ventas y reservas aparecerán listadas aquí.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {allClients.map((client) => (
              <div key={client.id} className="bg-bg-secondary border border-border rounded-2xl p-6 hover:border-gold/20 transition-all">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-bg-tertiary overflow-hidden border border-white/5">
                      <img 
                        src={client.clientAvatar || `https://ui-avatars.com/api/?name=${client.clientName}&background=random`} 
                        alt={client.clientName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{client.clientName}</h3>
                      <p className="text-xs text-gray-500">{client.clientEmail}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end">
                    <span className="text-[10px] uppercase tracking-widest font-black text-gold mb-1">{client.type}</span>
                    <h4 className="text-white font-bold text-sm mb-2">{client.itemName}</h4>
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        client.status === 'COMPLETED' || client.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' : 
                        client.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Monto</p>
                      <p className="text-white font-mono font-bold text-xl">${client.price}</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="icon" asChild className="rounded-xl border-border hover:border-gold h-12 w-12">
                          <Link href={`/perfil/${client.clientId}`}><ExternalLink size={18} /></Link>
                       </Button>
                       <Button asChild className="bg-gold text-black hover:bg-gold-light rounded-xl font-bold h-12 px-6 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gold/10">
                         <Link href={client.type === 'Servicio' ? `/dashboard/pedidos/${client.id}` : `/dashboard/pedidos?tab=sales`}>
                            Gestionar
                         </Link>
                       </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gold" />
                    Fecha: {new Date(client.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-gold" />
                    ID Pedido: {client.id.slice(0, 8)}
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-gold" />
                    Pago: Escrow Protegido
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
