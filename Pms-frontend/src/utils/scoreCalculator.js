export const calculateMetricScore = (metric, evaluationValue, targetTo) => {
  let calculatedWeight = 0;
  let actualachive = 0;

  const metricWeight = parseFloat(metric?.metric_weight) || 0;

  // Calculate weight consider greater than 100
  if (metric.calculated_with === ">100") {
    actualachive = (evaluationValue / targetTo) * 100;
    if (actualachive >= 120) {
      calculatedWeight = 5 * metricWeight;
    } else if (actualachive >= 100 && actualachive < 120) {
      calculatedWeight = 4 * metricWeight;
    } else if (actualachive >= 75 && actualachive < 100) {
      calculatedWeight = 3 * metricWeight;
    } else if (actualachive >= 50 && actualachive < 75) {
      calculatedWeight = 2 * metricWeight;
    } else if (actualachive > 0 && actualachive < 50) {
      calculatedWeight = 1 * metricWeight;
    } else {
      calculatedWeight = 0;
    }
  } else if (metric.calculated_with === "100") {
    //  GL
    if (metric.calculated_for === "Gl") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    //  ATM
    else if (metric.calculated_for === "ATM CRM Uptime Rate") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive >= 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 92 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 85 && actualachive < 92) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 80 && actualachive < 85) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Transaction
    else if (metric.calculated_for === "Transaction") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Customer Satisfaction
    else if (metric.calculated_for === "Customer Satisfaction") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 99 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 98 && actualachive < 99) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 97 && actualachive < 98) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Cash Book
    else if (metric.calculated_for === "Cash Book") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 95 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 90 && actualachive < 95) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 85 && actualachive < 90) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Cash Surprise Cheque
    else if (metric.calculated_for === "Cash Surprise Cheque") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 83 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 67 && actualachive < 83) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 50 && actualachive < 67) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Branch Compliance
    else if (metric.calculated_for === "Branch Compliance") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 95 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 90 && actualachive < 95) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 85 && actualachive < 90) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Audit Report
    else if (metric.calculated_for === "Audit Report") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 67 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Audit Quality
    else if (metric.calculated_for === "Audit Quality") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 95 && actualachive < 100) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 90 && actualachive < 95) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 85 && actualachive < 90) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Transaction Audit
    else if (metric.calculated_for === "Transaction Audit") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive === 100) {
        calculatedWeight = 4 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // SPM
    else if (metric.calculated_for === "SPM") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive < 3) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 3 && actualachive <= 4) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive > 4 && actualachive <= 5) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive > 5) {
        calculatedWeight = 0;
      } else {
        calculatedWeight = 0;
      }
    }
    // Arming C for District
    else if (metric.calculated_for === "Armingc Deposit Proportion") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive >= 86 && actualachive <= 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 71 && actualachive < 86) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 57 && actualachive < 71) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 14 && actualachive < 57) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // Employee Performance
    else if (metric.calculated_for === "Employee Performance") {
      actualachive = (evaluationValue / targetTo) * 100;
      if (actualachive >= 90 && actualachive <= 100) {
        calculatedWeight = 4 * metricWeight;
      } else if (actualachive >= 75 && actualachive < 90) {
        calculatedWeight = 3 * metricWeight;
      } else if (actualachive >= 50 && actualachive < 75) {
        calculatedWeight = 2 * metricWeight;
      } else if (actualachive >= 1 && actualachive < 50) {
        calculatedWeight = 1 * metricWeight;
      } else {
        calculatedWeight = 0;
      }
    }
    // branch Vital
    else if (metric.calculated_for === "Branch Vital") {
      calculatedWeight = (evaluationValue * metricWeight);
    }
  } else {
    calculatedWeight = 0;
  }

  const weight = Number(calculatedWeight.toFixed(2)) / 100;

  // Calculate final absolute score based on the cap logic used in userObjectiveEvaluations
  // A Cap is typically the multiplier (e.g. cap4 means max multiplier is 4)
  let score = 0;
  if (metric.cap === "cap1") {
    score = Number(weight || 0);
  } else if (metric.cap === "cap4") {
    score = (Number(weight || 0) * 100) / 4;
  } else if (metric.cap === "cap5" || !metric.cap) {
    score = (Number(weight || 0) * 100) / 5;
  }

  return {
    calculatedWeight,
    weight,
    score
  };
};
