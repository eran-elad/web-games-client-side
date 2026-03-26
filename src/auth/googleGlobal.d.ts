interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: string | number;
    }
  ): void;
  disableAutoSelect(): void;
}

interface GoogleAccounts {
  id: GoogleId;
}

interface GoogleNamespace {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

export {};
