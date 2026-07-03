import axios from "axios";
import xml2js from "xml2js";
import http from "http";
import https from "https";

const axiosInstance = axios.create({
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false }),
});

export const fetchAccountBalanceFromSoap = async (accountNumber) => {
  if (!accountNumber) {
    throw new Error("Account number is required");
  }

  const xmlRequest = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tws="http://temenos.com/TWSTXNDETAIL">
    <soapenv:Header/>
    <soapenv:Body>
      <tws:ACCOUNTBALANCEINFO>
        <WebRequestCommon>
          <company></company>
          <password>${process.env.SOAP_PASSWORD}</password>
          <userName>${process.env.SOAP_USERNAME}</userName>
        </WebRequestCommon>
        <ACCTBALINFOType>
          <enquiryInputCollection>
            <columnName>ACCOUNT.NUMBER</columnName>
            <criteriaValue>${accountNumber}</criteriaValue>
            <operand>EQ</operand>
          </enquiryInputCollection>
        </ACCTBALINFOType>
      </tws:ACCOUNTBALANCEINFO>
    </soapenv:Body>
  </soapenv:Envelope>
  `;

  const response = await axiosInstance.post(process.env.SOAP_URL, xmlRequest, {
    headers: {
      "Content-Type": "text/xml;charset=UTF-8",
    },
    timeout: 10000,
  });

  const parsed = await xml2js.parseStringPromise(response.data, {
    explicitArray: false,
    tagNameProcessors: [xml2js.processors.stripPrefix],
  });

  const body = parsed.Envelope?.Body;

  if (!body) {
    console.error("SOAP Body missing. Full Parsed Response:", JSON.stringify(parsed, null, 2));
    console.error("Raw XML Response:", response.data);
    throw new Error("Invalid SOAP response: Body not found");
  }

  const status = body.ACCOUNTBALANCEINFOResponse?.Status?.successIndicator;

  if (status !== "Success") {
    throw new Error(`SOAP request failed with status: ${status || "Unknown"}`);
  }

  const accountData =
    body?.ACCOUNTBALANCEINFOResponse?.ACCTBALINFOType?.gACCTBALINFODetailType?.mACCTBALINFODetailType;

  if (!accountData) {
    throw new Error("No account data found");
  }

  const openingDate = accountData.OPENINGDATE;
  if (!openingDate) {
    throw new Error("Account opening date is missing. Cannot validate account mapping eligibility.");
  }

  // Ensure account was opened between April 1, 2026 and June 30, 2026
  if (openingDate <= "20260401" || openingDate >= "20260630") {
    throw new Error("Account mapping is only allowed for accounts opened between April 1, 2026 and June 30, 2026.");
  }

  return {
    accountNo: accountData.AcctNo,
    name: accountData.Name,
    product: accountData.Product,
    currency: accountData.Ccy,
    workingBalance: accountData.WorkingBal,
    usableBalance: accountData.UseableBal,
    customer_id: accountData.CUSTOMERID,
    campany_code: accountData.COMPANYCODE,
    opening_date: openingDate,
  };
};

export const getAccountBalance = async (req, res) => {
  try {
    const { accountNumber } = req.body;
    const result = await fetchAccountBalanceFromSoap(accountNumber);
    // console.log("result: ", result);
    res.status(200).json({
      message: "Success",
      data: result,
    });
  } catch (error) {
    console.error("SOAP ERROR:", error.message);
    const status = error.message.includes("404") ? 404 : 400;
    res.status(status).json({
      message: error.message,
    });
  }
};
export const getUserInfo = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }

    // SOAP request
    const xmlRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tws="http://temenos.com/TWSTXNDETAIL">
      <soapenv:Header/>
      <soapenv:Body>
        <tws:USERINFO>
          <WebRequestCommon>
            <company></company>
            <password>${process.env.SOAP_PASSWORD}</password>
            <userName>${process.env.SOAP_USERNAME}</userName>
          </WebRequestCommon>
          <USERINFOType>
            <enquiryInputCollection>
              <columnName>SIGN.ON.NAME</columnName>
              <criteriaValue>${username}</criteriaValue>
              <operand>EQ</operand>
            </enquiryInputCollection>
          </USERINFOType>
        </tws:USERINFO>
      </soapenv:Body>
    </soapenv:Envelope>
    `;

    const response = await axiosInstance.post(process.env.SOAP_URL, xmlRequest, {
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
      },
      timeout: 10000,
    });

    const parsed = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });

    //   Extract BODY
    const body = parsed.Envelope?.Body;

    if (!body) {
      console.error("USERINFO SOAP Body missing. Full Parsed Response:", JSON.stringify(parsed, null, 2));
      console.error("Raw XML Response:", response.data);
      return res.status(500).json({ message: "Invalid SOAP response structure" });
    }

    //  STEP 1: CHECK STATUS FIRST
    const status = body.USERINFOResponse?.Status?.successIndicator;

    if (status !== "Success") {
      return res.status(400).json({
        message: "SOAP request failed",
        status: status || "Unknown",
      });
    }

    // 🔥 STEP 2: Extract USER DATA ONLY IF SUCCESS
    const userData =
      body?.USERINFOResponse?.USERINFOType?.gUSERINFODetailType?.mUSERINFODetailType;

    if (!userData) {
      return res.status(404).json({
        message: "No user data found",
      });
    }

    //   Clean response
    const result = {
      id: userData.ID,
      username: userData.USERNAME,
      department: userData.DEPARTMENTCODE,
      company: userData.COMPANYCODE,
      application: userData.INITAPPLICATION,
    };

    res.status(200).json({
      message: "Success",
      data: result,
    });
  } catch (error) {
    console.error("SOAP USERINFO Error:", error.message);

    res.status(500).json({
      message: "USERINFO request failed",
      error: error.message,
    });
  }
};

export const fetchLoanDetailFromSoap = async (loanaccountnumber) => {
  if (!loanaccountnumber) {
    throw new Error("Arrangement ID is required");
  }

  const xmlRequest = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tws="http://temenos.com/TWSTXNDETAIL">
    <soapenv:Header/>
    <soapenv:Body>
      <tws:AALOANDETAIL>
        <WebRequestCommon>
          <company></company>
          <password>${process.env.SOAP_PASSWORD}</password>
          <userName>${process.env.SOAP_USERNAME}</userName>
        </WebRequestCommon>
        <AALOANDETAILType>
          <enquiryInputCollection>
            <columnName>ARRANGEMENT.ID</columnName>
            <criteriaValue>${loanaccountnumber}</criteriaValue>
            <operand>EQ</operand>
          </enquiryInputCollection>
        </AALOANDETAILType>
      </tws:AALOANDETAIL>
    </soapenv:Body>
  </soapenv:Envelope>
  `;

  const response = await axiosInstance.post(process.env.SOAP_URL, xmlRequest, {
    headers: {
      "Content-Type": "text/xml;charset=UTF-8",
    },
    timeout: 10000,
  });

  const parsed = await xml2js.parseStringPromise(response.data, {
    explicitArray: false,
    tagNameProcessors: [xml2js.processors.stripPrefix],
  });

  const body = parsed.Envelope?.Body;

  if (!body) {
    throw new Error("Invalid SOAP response: Body not found");
  }

  const status =
    body.AALOANDETAILResponse?.Status?.successIndicator;

  if (status !== "Success") {
    throw new Error(`SOAP failed: ${status || "Unknown"}`);
  }

  const loanData =
    body.AALOANDETAILResponse?.AALOANDETAILType
      ?.gAALOANDETAILDetailType
      ?.mAALOANDETAILDetailType;

  if (!loanData) {
    throw new Error("No loan data found");
  }

  // ✅ FIXED FIELD MAPPING
  return {
    loanaccountnumber: loanData.ID,
    linkedApplicationId: loanData.LINKEDAPPLID,
    customerName: loanData.CUSTOMERNAME,
    outstandingBalance: loanData.OUTSTANDINGBALANCE,
    status: loanData.STATUS,
    branch: loanData.COMPANYNAME,
    companycode: loanData.COMPANYCODE,
  };
};

export const getLoanDetail = async (req, res) => {
  try {
    const { loanaccountnumber } = req.body;
    const result = await fetchLoanDetailFromSoap(loanaccountnumber);
    res.status(200).json({
      message: "Success",
      data: result,
    });

  } catch (error) {
    console.error("SOAP LOAN ERROR:", error.message);
    res.status(400).json({
      message: error.message,
    });
  }
};

export const fetchMMReferenceFromSoap = async (referenceNumber) => {
  if (!referenceNumber) {
    throw new Error("Reference number is required");
  }

  const xmlRequest = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tws="http://temenos.com/TWSTXNDETAIL">
    <soapenv:Header/>
    <soapenv:Body>
      <tws:CBOTXNDETAIL>
        <WebRequestCommon>
          <company></company>
          <password>${process.env.SOAP_PASSWORD}</password>
          <userName>${process.env.SOAP_USERNAME}</userName>
        </WebRequestCommon>
        <FTTTTXNDETAILType>
          <enquiryInputCollection>
            <columnName>TXN.REF</columnName>
            <criteriaValue>${referenceNumber}</criteriaValue>
            <operand>EQ</operand>
          </enquiryInputCollection>
        </FTTTTXNDETAILType>
      </tws:CBOTXNDETAIL>
    </soapenv:Body>
  </soapenv:Envelope>
  `;

  const response = await axiosInstance.post(process.env.SOAP_URL, xmlRequest, {
    headers: {
      "Content-Type": "text/xml;charset=UTF-8",
    },
    timeout: 10000,
  });

  const parsed = await xml2js.parseStringPromise(response.data, {
    explicitArray: false,
    tagNameProcessors: [xml2js.processors.stripPrefix],
  });

  const body = parsed.Envelope?.Body;

  if (!body) {
    throw new Error("Invalid SOAP response: Body not found");
  }

  // C#'s equivalent: //S:Body/ns4:CBOTXNDETAILResponse/FTTTTXNDETAILType/ns3:gFTTTTXNDETAILDetailType/ns3:mFTTTTXNDETAILDetailType
  const txnNode =
    body.CBOTXNDETAILResponse?.FTTTTXNDETAILType
      ?.gFTTTTXNDETAILDetailType
      ?.mFTTTTXNDETAILDetailType;

  if (!txnNode) {
    throw new Error("MM transaction details not found");
  }

  const account = txnNode.Account || "";
  const amtRaw = txnNode.Amount || "";
  const txnDate = txnNode.TXNDATE || "";
  const amtClean = amtRaw.replace(/^[A-Za-z]+/, "").trim();

  return {
    account: account,
    amount: amtClean,
    txnDate: txnDate,
  };
};

export const getMMReferenceDetail = async (req, res) => {
  try {
    const { referenceNumber, accountNumber } = req.body;

    if (!referenceNumber || !referenceNumber.toUpperCase().startsWith("MM")) {
      return res.status(400).json({
        success: false,
        message: "Only MM references are allowed."
      });
    }

    const result = await fetchMMReferenceFromSoap(referenceNumber);

    // Cross-check account
    if (result.account !== accountNumber) {
      return res.status(400).json({
        success: false,
        message: "MM reference account doesn't match selected account."
      });
    }

    // Check transaction date is not before April 1st of the current year
    const currentYear = new Date().getFullYear();
    const cutoffDateStr = `${currentYear}0401`;
    if (result.txnDate && result.txnDate < cutoffDateStr) {
      return res.status(400).json({
        success: false,
        message: `MM reference date (${result.txnDate}) is before April 1st, ${currentYear} and cannot be registered.`
      });
    }

    res.status(200).json({
      success: true,
      amount: result.amount,
      data: result,
    });

  } catch (error) {
    console.error("SOAP MM REF ERROR:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

