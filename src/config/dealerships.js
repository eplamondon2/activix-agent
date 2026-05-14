const DEALERSHIPS = {
  AUTO_FISET: {
    name: 'Auto Fiset',
    email: 'info@autofiset.com',
    useAdvisorEmail: false,
    signatures: {
      fr: `Cordialement,\nL'équipe Auto Fiset\n📞 info@autofiset.com`,
      en: `Best regards,\nThe Auto Fiset Team\n📞 info@autofiset.com`
    }
  },
  HYUNDAI_ST_RAYMOND: {
    name: 'Hyundai St-Raymond',
    email: null,
    useAdvisorEmail: true,
    signatures: {
      fr: `Cordialement,\nHyundai St-Raymond`,
      en: `Best regards,\nHyundai St-Raymond`
    }
  }
};

function getDealershipBySource(source) {
  if (!source) return { ...DEALERSHIPS.HYUNDAI_ST_RAYMOND, key: 'HYUNDAI_ST_RAYMOND' };
  const sourceLower = source.toLowerCase();
  if (sourceLower.includes('fiset')) {
    return { ...DEALERSHIPS.AUTO_FISET, key: 'AUTO_FISET' };
  }
  return { ...DEALERSHIPS.HYUNDAI_ST_RAYMOND, key: 'HYUNDAI_ST_RAYMOND' };
}

module.exports = { DEALERSHIPS, getDealershipBySource };
