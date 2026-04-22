export const PLAN_LIMITS = {
  starter: {
    maxClients: 50,
    maxAppointmentsPerMonth: 100,
    maxServices: 5,
    maxProducts: 20,
    maxStaff: 1,
    whatsappReminders: false,
    stripeConnect: false,
    onlineBooking: false,
    exportData: false,
    customPortal: false,
    reportDays: 30,
  },
  pro: {
    maxClients: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    maxStaff: 5,
    whatsappReminders: true,
    stripeConnect: true,
    onlineBooking: true,
    exportData: true,
    customPortal: true,
    reportDays: Infinity,
  },
  business: {
    maxClients: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    maxStaff: 10,
    whatsappReminders: true,
    stripeConnect: true,
    onlineBooking: true,
    exportData: true,
    customPortal: true,
    reportDays: Infinity,
  },
  enterprise: {
    maxClients: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    maxStaff: Infinity,
    whatsappReminders: true,
    stripeConnect: true,
    onlineBooking: true,
    exportData: true,
    customPortal: true,
    reportDays: Infinity,
  }
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanName] ?? PLAN_LIMITS.starter;
}

export function canPerformAction(
  plan: string, 
  feature: keyof typeof PLAN_LIMITS.starter
): boolean {
  const limits = getPlanLimits(plan);
  return !!limits[feature];
}
