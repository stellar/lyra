import React from "react";
import { useDispatch } from "react-redux";
import { Formik, Form } from "formik";
import styled from "styled-components";

import { SubmitButton } from "popup/basics/Forms";

import { fundAccount } from "popup/ducks/accountServices";

import {
  COLOR_PALETTE,
  FONT_WEIGHT,
  ROUNDED_CORNERS,
} from "popup/constants/styles";

const NotFundedWrapperEl = styled.section`
  background: ${COLOR_PALETTE.white};
  border-radius: ${ROUNDED_CORNERS};
  margin: 0 1rem 1.2rem 1rem;
  padding: 1rem 1.25rem;
`;

const NotFundedCopyEl = styled.p`
  font-size: 0.875rem;
  line-height: 1.375rem;
  margin: 0;
`;

const FriendBotCopyEl = styled(NotFundedCopyEl)`
  margin: 0.5rem 0;
`;

const NotFundedHeaderEl = styled.h3`
  align-items: center;
  color: ${COLOR_PALETTE.primary};
  display: flex;
  font-size: 1rem;

  &:before {
    border: 2px solid ${COLOR_PALETTE.primary};
    border-radius: 5rem;
    content: "i";
    display: inline-block;
    font-size: 0.8rem;
    font-weight: ${FONT_WEIGHT.bold};
    margin-right: 0.625rem;
    padding: 0.0625rem;
    text-align: center;
    width: 1rem;
  }
`;

export const NotFundedMessage = ({
  isTestnet,
  publicKey,
  setIsAccountFriendbotFunded,
}: {
  isTestnet: boolean;
  publicKey: string;
  setIsAccountFriendbotFunded: (isAccountFriendbotFunded: boolean) => void;
}) => {
  const dispatch = useDispatch();

  const handleFundAccount = async () => {
    await dispatch(fundAccount(publicKey));
    setIsAccountFriendbotFunded(true);
  };

  return (
    <>
      <NotFundedWrapperEl>
        <NotFundedHeaderEl>
          This Stellar address is not funded
        </NotFundedHeaderEl>
        <NotFundedCopyEl>
          To create this account, fund it with a minimum of 1 XLM.
        </NotFundedCopyEl>

        {isTestnet ? (
          <FriendBotCopyEl>
            You can fund this account on the test network using the Friendbot
            tool. Friendbot is a horizon API endpoint that will fund an account
            with 10,000 lumens on the test network.
          </FriendBotCopyEl>
        ) : null}
        <NotFundedCopyEl>
          <a
            href="https://developers.stellar.org/docs/tutorials/create-account/#create-account"
            rel="noreferrer"
            target="_blank"
          >
            Learn more about account creation
          </a>
        </NotFundedCopyEl>
        {isTestnet ? null : (
          <NotFundedCopyEl>
            <a
              href="https://www.stellar.org/lumens/exchanges"
              rel="noreferrer"
              target="_blank"
            >
              See where you can buy lumens
            </a>
          </NotFundedCopyEl>
        )}
      </NotFundedWrapperEl>
      {isTestnet ? (
        <Formik initialValues={{}} onSubmit={handleFundAccount}>
          {({ isSubmitting }) => (
            <Form>
              <SubmitButton isSubmitting={isSubmitting}>
                Fund with Friendbot
              </SubmitButton>
            </Form>
          )}
        </Formik>
      ) : null}
    </>
  );
};
