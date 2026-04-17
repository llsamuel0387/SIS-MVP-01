type AccountManageFeedbackProps = {
  message: string;
  error: string;
};

export default function AccountManageFeedback({ message, error }: AccountManageFeedbackProps) {
  return (
    <>
      {message ? <p className="notice notice-info">{message}</p> : null}
      {error ? <p className="notice notice-error">{error}</p> : null}
    </>
  );
}
