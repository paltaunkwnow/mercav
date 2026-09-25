export const COMMISSIONS = {
  ADS: {
    PLATFORM_FEE_PERCENTAGE: 10,
    ADVERTISER_FEE_PERCENTAGE: 5,
  },
  SERVICES: {
    PLATFORM_FEE_PERCENTAGE: 12, 
  }
};

export function calculateAdsCommission(basePrice: number, isFirstRentalFree: boolean) {
  const advertiserFee = basePrice * (COMMISSIONS.ADS.ADVERTISER_FEE_PERCENTAGE / 100);
  
  const ownerFee = isFirstRentalFree ? 0 : basePrice * ((COMMISSIONS.ADS.PLATFORM_FEE_PERCENTAGE - COMMISSIONS.ADS.ADVERTISER_FEE_PERCENTAGE) / 100);
  
  const totalPrice = basePrice + advertiserFee;
  const ownerPayout = basePrice - ownerFee;
  
  return {
    basePrice,
    advertiserFee,
    ownerFee,
    totalPrice,
    ownerPayout,
    platformRevenue: advertiserFee + ownerFee
  };
}

export function calculateServicesCommission(packagePrice: number) {
  const platformFee = packagePrice * (COMMISSIONS.SERVICES.PLATFORM_FEE_PERCENTAGE / 100);
  const providerPayout = packagePrice - platformFee;
  
  return {
    totalPrice: packagePrice,
    platformFee,
    providerPayout
  };
}
// creado por pato dev y askforvini
