import pool from "../db.js";

/* =========================================================
   BRANCH VITAL SUMMARY BY BRANCH CODE
========================================================= */
export const getBranchVitalSummaryByBranch = async (req, res) => {
    const { company_code } = req.body;
    console.log("requestdata", req.body);
    try {
        const query = `
      SELECT
        "COMPANY_CODE",
        "BRANCH_NAME",
        "LOCAL_DEPOSIT",
        "FCY",
        "MERCHANT_TRANSACTION_VOLUME",
        "AGENT_TRANSACTION_VOLUME",
        "TOTAL_RESULT",
        "OUT_OF_100"
      FROM public.branch_vital
      WHERE "COMPANY_CODE" = $1
    `;
        const result = await pool.query(query, [company_code]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No branch vital data found.",
            });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
};
