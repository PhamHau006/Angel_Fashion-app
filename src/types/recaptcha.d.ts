interface Window {
    onRecaptchaVerify?: (token: string) => void;
    onRecaptchaExpired?: () => void;
    grecaptcha?: {
      reset: () => void;
      render: (container: string | HTMLElement, parameters: object) => void;
      execute: () => void;
    };
  }