import React from "react";
import styled from "styled-components";
import { ErrorMessage, Field } from "formik";

import { COLOR_PALETTE } from "popup/styles";

import { Button } from "popup/basics/Buttons";

/* Button */

/* Form */
interface ErrorMessageProps {
  error: string;
}

export const FormErrorEl = styled.div`
  color: ${COLOR_PALETTE.error};
  font-size: 0.8125rem;
  height: 1rem;
  padding: 0.25rem 0 0.75rem;
  text-align: center;
  line-height: 1;
`;

const FormCheckBoxWrapper = styled.div`
  display: inline-block;
  margin-right: 0.625rem;
`;

export const ApiErrorMessage = ({ error }: ErrorMessageProps) => (
  <>{error ? <FormErrorEl>{error}</FormErrorEl> : null}</>
);

export const FormButton = styled(Button)`
  &:disabled {
    color: ${COLOR_PALETTE.secondaryText};
  }
`;

interface SubmitButtonProps {
  buttonCTA: string;
  isSubmitting: boolean;
  isValid?: boolean;
  size?: string;
  onClick?: () => void;
}

export const FormSubmitButton = ({
  buttonCTA,
  isSubmitting,
  isValid = true,
  onClick = () => {},
  size,
  ...props
}: SubmitButtonProps) => (
  <FormButton
    onClick={onClick}
    size={size}
    type="submit"
    disabled={isSubmitting || !isValid}
    {...props}
  >
    {isSubmitting ? "Loading..." : buttonCTA}
  </FormButton>
);

export const FormRow = styled.div`
  position: relative;
  padding: 0.2rem 0;
  max-width: 24.5rem;
  width: 100%;
`;

export const FormError = ({ name }: { name: string }) => (
  <FormErrorEl>
    <ErrorMessage name={name} component="span" />
  </FormErrorEl>
);

export const FormTextField = styled(Field)`
  border-radius: 1.25rem;
  border: ${(props) =>
    props.hasError ? `1px solid ${COLOR_PALETTE.error}` : 0};
  box-sizing: border-box;
  background: ${COLOR_PALETTE.inputBackground};
  font-size: 1rem;
  padding: 1.875rem 2.25rem;
  width: 100%;
  resize: none;

  &::-webkit-input-placeholder {
    font-family: "Muli", sans-serif;
  }

  &:-ms-input-placeholder {
    font-family: "Muli", sans-serif;
  }

  &:-moz-placeholder {
    font-family: "Muli", sans-serif;
  }

  &::-moz-placeholder {
    font-family: "Muli", sans-serif;
  }
`;

const FormCheckboxFieldLabelEl = styled.label`
  div {
    border-radius: 2rem;
    height: 1rem;
    width: 1rem;
  }
`;

const FormCheckboxFieldEl = styled(Field)`
  align-items: center;
  background: ${COLOR_PALETTE.inputBackground};
  border: 0.125rem solid ${COLOR_PALETTE.inputBackground};
  border-radius: 0.625rem;
  color: ${COLOR_PALETTE.primary};
  cursor: pointer;
  display: flex;
  height: 2rem;
  justify-content: space-evenly;
  width: 2rem;

  &:checked {
    background: ${COLOR_PALETTE.primary};
  }
`;

export const FormCheckboxField = ({ name }: { name: string }) => (
  <FormCheckBoxWrapper>
    <FormCheckboxFieldEl id={name} name={name} type="checkbox" />
    <FormCheckboxFieldLabelEl htmlFor={name}>
      <div />
    </FormCheckboxFieldLabelEl>
  </FormCheckBoxWrapper>
);

export const FormCheckboxLabel = styled.label`
  color: ${COLOR_PALETTE.secondaryText};
  font-size: 0.8125rem;
`;
