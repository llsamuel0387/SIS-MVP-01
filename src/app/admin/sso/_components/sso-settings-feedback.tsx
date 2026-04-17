type SsoSettingsFeedbackProps = {
  message: string;
  error: string;
};

export default function SsoSettingsFeedback({ message, error }: SsoSettingsFeedbackProps) {
  return (
    <>
      {message ? <p className="muted">{message}</p> : null}
      {error ? <p className="danger">{error}</p> : null}
    </>
  );
}
