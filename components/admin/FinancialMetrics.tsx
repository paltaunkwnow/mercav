"use client";

import React from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { TrendingUp, Users, DollarSign, Zap, CreditCard, Activity } from "lucide-react";

interface FinancialMetricsProps {
  revenueData: { month: string; amount: number }[];
  growthData: { month: string; users: number }[];
  planDistribution: { name: string; value: number; color: string }[];
  recentTransactions: { id: string; amount: number; createdAt: Date; metadata: any }[];
  summary: {
    totalRevenue: number;
    mrr: number;
    arpu: number;
    conversionRate: number;
  };
  operationalStats: {
    totalUsers: number;
    verifiedUsers: number;
    activeServices: number;
    activeSpaces: number;
  };
}

export function FinancialMetrics({ revenueData, growthData, planDistribution, recentTransactions, summary, operationalStats }: FinancialMetricsProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Quick Operational Stats */}
      <div className="flex flex-wrap items-center gap-4 md:gap-8 pb-4 border-b border-white/5">
        <QuickStat label="Usuarios" value={operationalStats.totalUsers} />
        <QuickStat label="Verificados" value={operationalStats.verifiedUsers} />
        <QuickStat label="Servicios" value={operationalStats.activeServices} />
        <QuickStat label="Espacios" value={operationalStats.activeSpaces} />
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Ingresos Totales" 
          value={`$${summary.totalRevenue.toLocaleString()}`} 
          trend="+14.2%" 
          icon={DollarSign}
          color="from-gold/20 to-transparent"
          iconColor="text-gold"
        />
        <KPICard 
          label="MRR" 
          value={`$${summary.mrr.toLocaleString()}`} 
          trend="+8.1%" 
          icon={Zap}
          color="from-blue-500/20 to-transparent"
          iconColor="text-blue-400"
        />
        <KPICard 
          label="ARPU" 
          value={`$${summary.arpu.toFixed(2)}`} 
          trend="+2.4%" 
          icon={CreditCard}
          color="from-purple-500/20 to-transparent"
          iconColor="text-purple-400"
        />
        <KPICard 
          label="Conversión" 
          value={`${summary.conversionRate.toFixed(1)}%`} 
          trend="+1.2%" 
          icon={Activity}
          color="from-green-500/20 to-transparent"
          iconColor="text-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                Tendencia de Ingresos
              </h3>
              <p className="text-xs text-gray-500">Histórico de facturación mensual</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] outline-none">
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#FFD700' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FFD700" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Crecimiento de Usuarios
              </h3>
              <p className="text-xs text-gray-500">Nuevos registros por mes</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                  {growthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === growthData.length - 1 ? '#60A5FA' : '#3B82F640'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Pie Chart */}
        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl flex flex-col">
          <h3 className="font-bold mb-6">Distribución de Planes</h3>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {planDistribution.map((plan) => (
              <div key={plan.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: plan.color }} />
                <span className="text-[10px] text-gray-400 uppercase font-bold">{plan.name}: {plan.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 rounded-3xl border border-white/5 bg-black/40 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Flujo de Caja Reciente</h3>
            <button className="text-[10px] text-gold font-bold hover:underline">Ver Todo</button>
          </div>
          <div className="space-y-3">
             {recentTransactions.length === 0 ? (
               <div className="py-10 text-center text-gray-500 italic text-xs">No hay transacciones recientes.</div>
             ) : recentTransactions.map((tx) => (
               <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {tx.metadata?.description || "Pago de Sistema"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        ID: {tx.id?.slice(0, 12) || "N/A"}... · {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">+${Number(tx.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Completado</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold font-mono tracking-tighter text-white">{value.toLocaleString()}</span>
    </div>
  );
}

function KPICard({ label, value, trend, icon: Icon, color, iconColor }: any) {
  return (
    <div className={`rounded-3xl border border-white/5 bg-bg-secondary bg-gradient-to-br ${color} p-6 relative overflow-hidden group`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-green-400">{trend}</span>
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-bold font-mono tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
