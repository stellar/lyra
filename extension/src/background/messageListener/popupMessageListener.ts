import { KeyManager, KeyManagerPlugins, KeyType } from "@stellar/wallet-sdk";
import StellarSdk from "stellar-sdk";
// @ts-ignore
import { fromMnemonic, generateMnemonic } from "stellar-hd-wallet";

import { SERVICE_TYPES } from "@shared/constants/services";
import { APPLICATION_STATE } from "@shared/constants/applicationState";
import { isTestnet } from "@shared/constants/stellar";

import { Response as Request } from "@shared/api/types";
import { MessageResponder } from "background/types";

import { ALLOWLIST_ID } from "constants/localStorageTypes";

import { getPunycodedDomain, getUrlHostname } from "helpers/urls";

import { SessionTimer } from "background/helpers/session";
import { store } from "background/store";
import {
  hasPrivateKeySelector,
  privateKeySelector,
  logIn,
  logOut,
  mnemonicPhraseSelector,
  publicKeySelector,
} from "background/ducks/session";

const KEY_ID = "keyId";
const APPLICATION_ID = "applicationState";
const DATA_SHARING_ID = "dataSharingStatus";

const sessionTimer = new SessionTimer();

export const responseQueue: Array<(message?: any) => void> = [];
export const transactionQueue: Array<{
  sign: (sourceKeys: {}) => void;
  toXDR: () => void;
}> = [];

interface StellarHdWallet {
  getPublicKey: (number: Number) => string;
  getSecret: (number: Number) => string;
}

export const popupMessageListener = (request: Request) => {
  const localKeyStore = new KeyManagerPlugins.LocalStorageKeyStore();
  localKeyStore.configure({ storage: localStorage });
  const keyManager = new KeyManager({
    keyStore: localKeyStore,
  });
  keyManager.registerEncrypter(KeyManagerPlugins.ScryptEncrypter);

  const _storeAccount = async ({
    mnemonicPhrase,
    password,
    wallet,
  }: {
    mnemonicPhrase: string;
    password: string;
    wallet: StellarHdWallet;
  }) => {
    const publicKey = wallet.getPublicKey(0);
    const privateKey = wallet.getSecret(0);

    store.dispatch(logIn({ publicKey, mnemonicPhrase }));

    const keyMetadata = {
      key: {
        extra: { mnemonicPhrase },
        type: KeyType.plaintextKey,
        publicKey,
        privateKey,
      },

      password,
      encrypterName: KeyManagerPlugins.ScryptEncrypter.name,
    };

    let keyStore = { id: "" };

    try {
      keyStore = await keyManager.storeKey(keyMetadata);
    } catch (e) {
      console.error(e);
    }

    localStorage.setItem(KEY_ID, keyStore.id);
  };

  const createAccount = async () => {
    const { password } = request;

    const mnemonicPhrase = generateMnemonic({ entropyBits: 128 });
    const wallet = fromMnemonic(mnemonicPhrase);

    if (isTestnet) {
      // fund the account automatically if we're in a dev environment
      try {
        const response = await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(
            wallet.getPublicKey(0),
          )}`,
        );
        const responseJSON = await response.json();
        console.log("SUCCESS! You have a new account :)\n", responseJSON);
      } catch (e) {
        console.error(e);
        throw new Error("Error creating account");
      }
    }

    await _storeAccount({
      password,
      wallet,
      mnemonicPhrase,
    });
    localStorage.setItem(APPLICATION_ID, APPLICATION_STATE.PASSWORD_CREATED);

    return { publicKey: publicKeySelector(store.getState()) };
  };

  const loadAccount = () => {
    console.log(store.getState());
    return {
      hasPrivateKey: hasPrivateKeySelector(store.getState()),
      publicKey: publicKeySelector(store.getState()),
      applicationState: localStorage.getItem(APPLICATION_ID) || "",
    };
  };

  const getMnemonicPhrase = () => ({
    mnemonicPhrase: mnemonicPhraseSelector(store.getState()),
  });

  const confirmMnemonicPhrase = () => {
    const isCorrectPhrase =
      mnemonicPhraseSelector(store.getState()) ===
      request.mnemonicPhraseToConfirm;

    const applicationState = isCorrectPhrase
      ? APPLICATION_STATE.MNEMONIC_PHRASE_CONFIRMED
      : APPLICATION_STATE.MNEMONIC_PHRASE_FAILED;

    localStorage.setItem(APPLICATION_ID, applicationState);

    return {
      isCorrectPhrase,
      applicationState: localStorage.getItem(APPLICATION_ID) || "",
    };
  };

  const recoverAccount = () => {
    const { password, recoverMnemonic } = request;
    let wallet;
    let applicationState;
    try {
      wallet = fromMnemonic(recoverMnemonic);
    } catch (e) {
      console.error(e);
    }

    if (wallet) {
      _storeAccount({ mnemonicPhrase: recoverMnemonic, password, wallet });

      // if we don't have an application state, assign them one
      applicationState =
        localStorage.getItem(APPLICATION_ID) ||
        APPLICATION_STATE.MNEMONIC_PHRASE_CONFIRMED;

      localStorage.setItem(APPLICATION_ID, applicationState);
    }


    return {
      publicKey: publicKeySelector(store.getState()),
      applicationState: localStorage.getItem(APPLICATION_ID) || "",
    };
  };

  const showBackupPhrase = async () => {
    const { password } = request;

    try {
      await keyManager.loadKey(localStorage.getItem(KEY_ID) || "", password);
      return {};
    } catch (e) {
      return { error: "Incorrect Password" };
    }
  };

  const confirmPassword = async () => {
    const { password } = request;
    let keyStore;
    try {
      keyStore = await keyManager.loadKey(
        localStorage.getItem(KEY_ID) || "",
        password,
      );
    } catch (e) {
      console.error(e);
    }
    let extra = { mnemonicPhrase: "" };
    let publicKey = "";
    let privateKey = "";

    if (keyStore) {
      ({ privateKey, publicKey, extra } = keyStore);
      const { mnemonicPhrase } = extra;
      store.dispatch(logIn({ publicKey, mnemonicPhrase }));
      sessionTimer.startSession({ privateKey });
    }

    return {
      publicKey: publicKeySelector(store.getState()),
      hasPrivateKey: hasPrivateKeySelector(store.getState()),
      applicationState: localStorage.getItem(APPLICATION_ID) || "",
    };
  };

  const grantAccess = () => {
    const { url = "" } = request;
    const sanitizedUrl = getUrlHostname(url);
    const punycodedDomain = getPunycodedDomain(sanitizedUrl);

    // TODO: right now we're just grabbing the last thing in the queue, but this should be smarter.
    // Maybe we need to search through responses to find a matching reponse :thinking_face
    const response = responseQueue.pop();
    const allowListStr = localStorage.getItem(ALLOWLIST_ID) || "";
    const allowList = allowListStr.split(",");
    allowList.push(punycodedDomain);

    localStorage.setItem(ALLOWLIST_ID, allowList.join());

    if (typeof response === "function") {
      return response(url);
    }

    return { error: "Access was denied" };
  };

  const rejectAccess = () => {
    const response = responseQueue.pop();
    if (response) {
      response();
    }
  };

  const signTransaction = () => {
    const privateKey = privateKeySelector(store.getState());

    if (privateKey.length) {
      const sourceKeys = StellarSdk.Keypair.fromSecret(privateKey);

      let response;

      const transactionToSign = transactionQueue.pop();

      if (transactionToSign) {
        transactionToSign.sign(sourceKeys);
        response = transactionToSign.toXDR();
      }

      const transactionResponse = responseQueue.pop();

      if (typeof transactionResponse === "function") {
        transactionResponse(response);
        return {};
      }
    }

    return { error: "Session timed out" };
  };

  const rejectTransaction = () => {
    transactionQueue.pop();
    const response = responseQueue.pop();
    if (response) {
      response();
    }
  };

  const signOut = () => {
    store.dispatch(logOut());

    return {
      publicKey: publicKeySelector(store.getState()),
      applicationState: localStorage.getItem(APPLICATION_ID) || "",
    };
  };

  /* @TODO add toggle for Mainnet & Testnet */
  const saveSettings = () => {
    const { isDataSharingAllowed } = request;

    localStorage.setItem(DATA_SHARING_ID, JSON.stringify(isDataSharingAllowed));

    return {
      isDataSharingAllowed,
    };
  };

  const loadSettings = () => {
    const dataSharingValue = localStorage.getItem(DATA_SHARING_ID) || "true";
    const isDataSharingAllowed = JSON.parse(dataSharingValue);

    return {
      isDataSharingAllowed,
    };
  };

  const messageResponder: MessageResponder = {
    [SERVICE_TYPES.CREATE_ACCOUNT]: createAccount,
    [SERVICE_TYPES.LOAD_ACCOUNT]: loadAccount,
    [SERVICE_TYPES.GET_MNEMONIC_PHRASE]: getMnemonicPhrase,
    [SERVICE_TYPES.CONFIRM_MNEMONIC_PHRASE]: confirmMnemonicPhrase,
    [SERVICE_TYPES.RECOVER_ACCOUNT]: recoverAccount,
    [SERVICE_TYPES.CONFIRM_PASSWORD]: confirmPassword,
    [SERVICE_TYPES.GRANT_ACCESS]: grantAccess,
    [SERVICE_TYPES.REJECT_ACCESS]: rejectAccess,
    [SERVICE_TYPES.SIGN_TRANSACTION]: signTransaction,
    [SERVICE_TYPES.REJECT_TRANSACTION]: rejectTransaction,
    [SERVICE_TYPES.SIGN_OUT]: signOut,
    [SERVICE_TYPES.SHOW_BACKUP_PHRASE]: showBackupPhrase,
    [SERVICE_TYPES.SAVE_SETTINGS]: saveSettings,
    [SERVICE_TYPES.LOAD_SETTINGS]: loadSettings,
  };

  return messageResponder[request.type]();
};
