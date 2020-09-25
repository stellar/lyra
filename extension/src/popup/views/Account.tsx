import React, { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { getAccountBalance } from "@shared/api/internal";

import { truncatedPublicKey } from "helpers/stellar";
import { emitMetric } from "helpers/metrics";
import { publicKeySelector } from "popup/ducks/authServices";

import { POPUP_WIDTH } from "constants/dimensions";
import { ROUTES } from "popup/constants/routes";

import { COLOR_PALETTE } from "popup/constants/styles";
import { METRIC_NAMES } from "popup/constants/metricsNames";

import { BasicButton } from "popup/basics/Buttons";

import { Toast } from "popup/components/Toast";
import { Menu } from "popup/components/Menu";

import CopyColorIcon from "popup/assets/copy-color.svg";
import QrCode from "popup/assets/qr-code.png";
import StellarLogo from "popup/assets/stellar-logo.png";
import { Footer } from "popup/components/Footer";

import "popup/metrics/authServices";

const AccountEl = styled.div`
  width: 100%;
  max-width: ${POPUP_WIDTH}px;
  box-sizing: border-box;
  padding: 1.25rem 2rem;
`;

const PublicKeyDisplayEl = styled.div`
  position: relative;
  display: inline-block;
  padding-right: 0.45rem;
  font-size: 0.81rem;
  text-align: right;

  p {
    margin: 0;
    line-height: 2;
  }
`;

const PublicKeyEl = styled.span`
  font-size: 0.875rem;
  color: ${COLOR_PALETTE.secondaryText};
  margin-right: 1rem;
  opacity: 0.7;
`;

const CopyButtonEl = styled(BasicButton)`
  padding: 0;
  margin: 0;
  vertical-align: middle;

  img {
    width: 1rem;
    height: 1rem;
  }
`;

const QrButton = styled(BasicButton)`
  background: url(${QrCode});
  background-size: cover;
  margin-right: 1rem;
  width: 1rem;
  height: 1rem;
`;

const VerticalCenterLink = styled(Link)`
  vertical-align: middle;
`;

const AccountDetailsEl = styled.section`
  align-content: center;
  align-items: center;
  display: flex;
  padding: 2.25rem 0 8.5rem;
  justify-content: space-evenly;
`;

const StellarLogoEl = styled.img`
  height: 6.1rem;
  width: 7.3rem;
`;

const LumenBalanceEl = styled.h2`
  font-size: 1.43rem;
  font-weight: 300;
`;

const CopiedToastWrapperEl = styled.div`
  margin: 1rem 0 0 -2rem;
`;

const RowEl = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const Account = () => {
  const [accountBalance, setaccountBalance] = useState("0.00");
  const [isCopied, setIsCopied] = useState(false);
  const publicKey = useSelector(publicKeySelector);

  useEffect(() => {
    let res = { balance: "" };
    const fetchAccountBalance = async () => {
      try {
        res = await getAccountBalance(publicKey);
      } catch (e) {
        console.log(e);
      }
      const { balance } = res;
      setaccountBalance(Number(balance).toFixed(2));
    };
    fetchAccountBalance();
  }, [publicKey]);

  return (
    <>
      <AccountEl>
        <RowEl>
          <Menu />
          <PublicKeyDisplayEl>
            <p>Your public key</p>
            <PublicKeyEl>{truncatedPublicKey(publicKey)}</PublicKeyEl>
            <VerticalCenterLink to={ROUTES.viewPublicKey}>
              <QrButton />
            </VerticalCenterLink>
            <CopyToClipboard
              text={publicKey}
              onCopy={() => {
                setIsCopied(true);
                emitMetric(METRIC_NAMES.copyPublickKey);
              }}
            >
              <CopyButtonEl>
                <img src={CopyColorIcon} alt="copy button" />
              </CopyButtonEl>
            </CopyToClipboard>
            <CopiedToastWrapperEl>
              <Toast
                message="Copied to your clipboard 👌"
                isShowing={isCopied}
                setIsShowing={setIsCopied}
              />
            </CopiedToastWrapperEl>
          </PublicKeyDisplayEl>
        </RowEl>
        <AccountDetailsEl>
          <StellarLogoEl alt="Stellar logo" src={StellarLogo} />
          <div>
            <LumenBalanceEl>{accountBalance} XLM</LumenBalanceEl>
          </div>
        </AccountDetailsEl>
      </AccountEl>
      <Footer />
    </>
  );
};
