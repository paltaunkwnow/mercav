"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MilestoneCard from "./MilestoneCard";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number | string;
  status: "PENDING" | "COMPLETED" | "PAID";
  dueDate?: string | Date;
  completedAt?: string | Date;
  approvedAt?: string | Date;
  released?: boolean;
}

interface MilestonesSectionProps {
  milestones: Milestone[];
  serviceId: string;
  isClient: boolean;
  isProvider: boolean;
  onRefresh?: () => void;
}

export default function MilestonesSection({
  milestones,
  serviceId,
  isClient,
  isProvider,
  onRefresh,
}: MilestonesSectionProps) {
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(
    null
  );

  if (!milestones || milestones.length === 0) {
    return (
      <section aria-labelledby="order-milestones" className="mv-panel p-5 md:p-8">
        <h2 id="order-milestones" className="mv-h3 mb-4">
          Hitos del Proyecto
        </h2>
        <div className="rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
          No hay hitos definidos para este proyecto. Los hitos permiten dividir
          el trabajo en etapas con pagos progresivos.
        </div>
      </section>
    );
  }

  // Estadísticas de milestones
  const totalAmount = milestones.reduce(
    (sum, m) => sum + Number(m.amount || 0),
    0
  );
  const completedCount = milestones.filter(
    (m) => m.status === "COMPLETED" || m.status === "PAID"
  ).length;
  const paidCount = milestones.filter((m) => m.status === "PAID").length;

  const fmtMoney = (v: number) => {
    return v.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <section aria-labelledby="order-milestones" className="mv-panel p-5 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="order-milestones" className="mv-h3 mb-2">
            Hitos del Proyecto
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {completedCount} de {milestones.length} completados · $
            {fmtMoney(totalAmount)} USD total
          </p>
        </div>
        {paidCount > 0 && (
          <div className="text-sm">
            <span className="inline-block rounded-full bg-green-500/10 px-3 py-1 text-green-600">
              ${fmtMoney(
                milestones
                  .filter((m) => m.status === "PAID")
                  .reduce((sum, m) => sum + Number(m.amount || 0), 0)
              )}{" "}
              liberados
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <MilestoneCard
                milestone={milestone}
                isClient={isClient}
                isProvider={isProvider}
                serviceId={serviceId}
                onApprovalSuccess={onRefresh}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
// creado por pato dev y askforvini
