import axios from "axios";
import xml2js from "xml2js";

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

  const response = await axios.post(process.env.SOAP_URL, xmlRequest, {
    headers: {
      "Content-Type": "text/xml;charset=UTF-8",
    },
    timeout: 10000,
  });

  const parsed = await xml2js.parseStringPromise(response.data, {
    explicitArray: false,
  });

  const body = parsed["S:Envelope"]?.["S:Body"];
  const status =
    body?.["ns5:ACCOUNTBALANCEINFOResponse"]?.["Status"]?.[
      "successIndicator"
    ];

  if (status !== "Success") {
    throw new Error(`SOAP request failed with status: ${status || "Unknown"}`);
  }

  const accountData =
    body?.["ns5:ACCOUNTBALANCEINFOResponse"]?.["ACCTBALINFOType"]?.[
      "ns2:gACCTBALINFODetailType"
    ]?.["ns2:mACCTBALINFODetailType"];

  if (!accountData) {
    throw new Error("No account data found");
  }

  return {
    accountNo: accountData["ns2:AcctNo"],
    name: accountData["ns2:Name"],
    product: accountData["ns2:Product"],
    currency: accountData["ns2:Ccy"],
    workingBalance: accountData["ns2:WorkingBal"],
    usableBalance: accountData["ns2:UseableBal"],
    customer_id: accountData["ns2:CUSTOMERID"],
    campany_code: accountData["ns2:COMPANYCODE"],
  };
};

export const getAccountBalance = async (req, res) => {
  try {
    const { accountNumber } = req.body;
    const result = await fetchAccountBalanceFromSoap(accountNumber);

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

    const response = await axios.post(process.env.SOAP_URL, xmlRequest, {
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
      },
      timeout: 10000,
    });

    const parsed = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
    });

    //   Extract BODY
    const body = parsed["S:Envelope"]?.["S:Body"];

    //  STEP 1: CHECK STATUS FIRST
    const status =
      body?.["ns5:USERINFOResponse"]?.["Status"]?.["successIndicator"];

    if (status !== "Success") {
      return res.status(400).json({
        message: "SOAP request failed",
        status: status || "Unknown",
      });
    }

    // 🔥 STEP 2: Extract USER DATA ONLY IF SUCCESS
    const userData =
      body?.["ns5:USERINFOResponse"]?.["USERINFOType"]?.[
        "ns3:gUSERINFODetailType"
      ]?.["ns3:mUSERINFODetailType"];

    if (!userData) {
      return res.status(404).json({
        message: "No user data found",
      });
    }

    //   Clean response
    const result = {
      id: userData["ns3:ID"],
      username: userData["ns3:USERNAME"],
      department: userData["ns3:DEPARTMENTCODE"],
      company: userData["ns3:COMPANYCODE"],
      application: userData["ns3:INITAPPLICATION"],
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
